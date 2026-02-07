"""User Schemas"""
from marshmallow import Schema, fields, validate


class UserSchema(Schema):
    """User schema for serialization"""
    id = fields.Int(dump_only=True)
    email = fields.Email(required=True)
    name = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    role = fields.Str(validate=validate.OneOf(['owner', 'admin', 'editor', 'analyst', 'viewer']))
    is_active = fields.Bool()
    created_at = fields.DateTime(dump_only=True)
    last_login = fields.DateTime(dump_only=True)


class LoginSchema(Schema):
    """Login request schema"""
    email = fields.Email(required=True)
    password = fields.Str(required=True, load_only=True)


class RegisterSchema(Schema):
    """User registration schema"""
    email = fields.Email(required=True)
    password = fields.Str(required=True, load_only=True, validate=validate.Length(min=8))
    name = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    tenant_id = fields.Str(required=True, validate=validate.Length(min=1, max=50))
