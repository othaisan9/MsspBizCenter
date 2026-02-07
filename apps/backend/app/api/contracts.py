"""Contracts API"""
from flask import request, g
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required
from marshmallow import ValidationError

from app.extensions import db
from app.models import Contract
from app.schemas import ContractSchema
from app.services.encryption import EncryptionService
from app.utils.decorators import tenant_required, role_required

api = Namespace('contracts', description='Contract management operations')

# Swagger models
contract_model = api.model('Contract', {
    'id': fields.Integer(readonly=True, description='Contract ID'),
    'contract_number': fields.String(required=True, description='Contract number'),
    'customer_name': fields.String(required=True, description='Customer name'),
    'title': fields.String(required=True, description='Contract title'),
    'description': fields.String(description='Contract description'),
    'amount': fields.String(required=True, description='Contract amount (encrypted)'),
    'currency': fields.String(description='Currency code (ISO 4217)', example='KRW'),
    'start_date': fields.Date(required=True, description='Contract start date'),
    'end_date': fields.Date(required=True, description='Contract end date'),
    'auto_renewal': fields.Boolean(description='Auto renewal flag'),
    'status': fields.String(description='Contract status', enum=['draft', 'active', 'expired', 'terminated', 'renewed']),
    'contact_email': fields.String(description='Contact email'),
    'contact_phone': fields.String(description='Contact phone'),
    'notes': fields.String(description='Additional notes')
})


@api.route('')
class ContractList(Resource):
    @api.doc('list_contracts', security='jwt')
    @api.param('status', 'Filter by status')
    @api.param('customer_name', 'Filter by customer name')
    @api.response(200, 'Success')
    @jwt_required()
    @tenant_required
    @role_required('owner', 'admin', 'editor')
    def get(self):
        """List all contracts for current tenant (requires Editor role or higher)"""
        query = Contract.query.filter_by(tenant_id=g.tenant_id)

        # Apply filters
        if 'status' in request.args:
            query = query.filter_by(status=request.args['status'])
        if 'customer_name' in request.args:
            query = query.filter(Contract.customer_name.ilike(f"%{request.args['customer_name']}%"))

        contracts = query.order_by(Contract.end_date.desc()).all()

        # Decrypt amount only for Owner/Admin roles
        can_decrypt = g.user_role in ['owner', 'admin']

        return {
            'contracts': [contract.to_dict(decrypt_amount=can_decrypt) for contract in contracts],
            'total': len(contracts)
        }, 200

    @api.doc('create_contract', security='jwt')
    @api.expect(contract_model)
    @api.response(201, 'Contract created')
    @api.response(400, 'Validation error')
    @jwt_required()
    @tenant_required
    @role_required('owner', 'admin')
    def post(self):
        """Create a new contract (requires Admin role or higher)"""
        schema = ContractSchema()
        try:
            data = schema.load(request.json)
        except ValidationError as e:
            return {'errors': e.messages}, 400

        # Encrypt amount
        encryption_service = EncryptionService()
        amount_encrypted = encryption_service.encrypt(data['amount'])

        contract = Contract(
            tenant_id=g.tenant_id,
            created_by=g.user_id,
            contract_number=data['contract_number'],
            customer_name=data['customer_name'],
            title=data['title'],
            description=data.get('description'),
            amount_encrypted=amount_encrypted,
            currency=data.get('currency', 'KRW'),
            start_date=data['start_date'],
            end_date=data['end_date'],
            auto_renewal=data.get('auto_renewal', False),
            status=data.get('status', 'draft'),
            contact_email=data.get('contact_email'),
            contact_phone=data.get('contact_phone'),
            notes=data.get('notes')
        )

        db.session.add(contract)
        db.session.commit()

        return {
            'message': 'Contract created successfully',
            'contract': contract.to_dict(decrypt_amount=True)
        }, 201


@api.route('/<int:contract_id>')
@api.param('contract_id', 'Contract ID')
class ContractDetail(Resource):
    @api.doc('get_contract', security='jwt')
    @api.response(200, 'Success')
    @api.response(404, 'Contract not found')
    @jwt_required()
    @tenant_required
    @role_required('owner', 'admin', 'editor')
    def get(self, contract_id):
        """Get contract by ID (requires Editor role or higher)"""
        contract = Contract.query.filter_by(id=contract_id, tenant_id=g.tenant_id).first()

        if not contract:
            return {'error': 'Contract not found'}, 404

        # Decrypt amount only for Owner/Admin roles
        can_decrypt = g.user_role in ['owner', 'admin']

        return {'contract': contract.to_dict(decrypt_amount=can_decrypt)}, 200

    @api.doc('update_contract', security='jwt')
    @api.expect(contract_model)
    @api.response(200, 'Contract updated')
    @api.response(404, 'Contract not found')
    @jwt_required()
    @tenant_required
    @role_required('owner', 'admin')
    def put(self, contract_id):
        """Update contract by ID (requires Admin role or higher)"""
        contract = Contract.query.filter_by(id=contract_id, tenant_id=g.tenant_id).first()

        if not contract:
            return {'error': 'Contract not found'}, 404

        schema = ContractSchema(partial=True)
        try:
            data = schema.load(request.json)
        except ValidationError as e:
            return {'errors': e.messages}, 400

        # If amount is being updated, encrypt it
        if 'amount' in data:
            encryption_service = EncryptionService()
            contract.amount_encrypted = encryption_service.encrypt(data['amount'])
            del data['amount']

        for key, value in data.items():
            setattr(contract, key, value)

        db.session.commit()

        return {
            'message': 'Contract updated successfully',
            'contract': contract.to_dict(decrypt_amount=True)
        }, 200

    @api.doc('delete_contract', security='jwt')
    @api.response(204, 'Contract deleted')
    @api.response(404, 'Contract not found')
    @jwt_required()
    @tenant_required
    @role_required('owner')
    def delete(self, contract_id):
        """Delete contract by ID (requires Owner role)"""
        contract = Contract.query.filter_by(id=contract_id, tenant_id=g.tenant_id).first()

        if not contract:
            return {'error': 'Contract not found'}, 404

        db.session.delete(contract)
        db.session.commit()

        return '', 204
