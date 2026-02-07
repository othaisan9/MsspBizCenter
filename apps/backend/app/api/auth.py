"""Authentication API"""
from datetime import datetime
from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity, get_jwt
from marshmallow import ValidationError

from app.extensions import db
from app.models import User
from app.schemas import LoginSchema, RegisterSchema

api = Namespace('auth', description='Authentication operations')

# Swagger models
login_model = api.model('Login', {
    'email': fields.String(required=True, description='User email', example='admin@msspbiz.local'),
    'password': fields.String(required=True, description='User password', example='Admin@1234!')
})

register_model = api.model('Register', {
    'email': fields.String(required=True, description='User email'),
    'password': fields.String(required=True, description='User password (min 8 chars)'),
    'name': fields.String(required=True, description='Full name'),
    'tenant_id': fields.String(required=True, description='Tenant ID')
})

token_response_model = api.model('TokenResponse', {
    'access_token': fields.String(description='JWT access token'),
    'refresh_token': fields.String(description='JWT refresh token'),
    'user': fields.Raw(description='User information')
})


@api.route('/login')
class Login(Resource):
    @api.doc('user_login')
    @api.expect(login_model)
    @api.response(200, 'Success', token_response_model)
    @api.response(401, 'Invalid credentials')
    def post(self):
        """User login"""
        schema = LoginSchema()
        try:
            data = schema.load(request.json)
        except ValidationError as e:
            return {'errors': e.messages}, 400

        user = User.query.filter_by(email=data['email']).first()

        if not user or not user.check_password(data['password']):
            return {'error': 'Invalid email or password'}, 401

        if not user.is_active:
            return {'error': 'Account is inactive'}, 403

        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()

        # Create JWT tokens with additional claims
        additional_claims = {
            'user_id': user.id,
            'email': user.email,
            'tenant_id': user.tenant_id,
            'role': user.role
        }

        access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
        refresh_token = create_refresh_token(identity=str(user.id), additional_claims=additional_claims)

        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.to_dict()
        }, 200


@api.route('/register')
class Register(Resource):
    @api.doc('user_register')
    @api.expect(register_model)
    @api.response(201, 'User created successfully')
    @api.response(400, 'Validation error')
    @api.response(409, 'Email already exists')
    def post(self):
        """Register new user"""
        schema = RegisterSchema()
        try:
            data = schema.load(request.json)
        except ValidationError as e:
            return {'errors': e.messages}, 400

        # Check if email already exists
        if User.query.filter_by(email=data['email']).first():
            return {'error': 'Email already registered'}, 409

        # Create new user
        user = User(
            email=data['email'],
            name=data['name'],
            tenant_id=data['tenant_id'],
            role='viewer'  # Default role
        )
        user.set_password(data['password'])

        db.session.add(user)
        db.session.commit()

        return {
            'message': 'User registered successfully',
            'user': user.to_dict()
        }, 201


@api.route('/refresh')
class TokenRefresh(Resource):
    @api.doc('token_refresh', security='jwt_refresh')
    @api.response(200, 'Token refreshed', token_response_model)
    @jwt_required(refresh=True)
    def post(self):
        """Refresh access token using refresh token"""
        user_id = get_jwt_identity()  # Already a string
        claims = get_jwt()

        additional_claims = {
            'user_id': int(user_id),
            'email': claims.get('email'),
            'tenant_id': claims.get('tenant_id'),
            'role': claims.get('role')
        }

        access_token = create_access_token(identity=user_id, additional_claims=additional_claims)

        return {'access_token': access_token}, 200


@api.route('/me')
class Me(Resource):
    @api.doc('get_current_user', security='jwt')
    @api.response(200, 'Current user information')
    @jwt_required()
    def get(self):
        """Get current user information"""
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)

        if not user:
            return {'error': 'User not found'}, 404

        return {'user': user.to_dict()}, 200
