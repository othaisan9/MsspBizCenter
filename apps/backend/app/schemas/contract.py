"""Contract Schemas"""
from marshmallow import Schema, fields, validate


class ContractSchema(Schema):
    """Contract schema for serialization/validation"""
    id = fields.Int(dump_only=True)
    tenant_id = fields.Str(dump_only=True)
    contract_number = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    customer_name = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    title = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    description = fields.Str(allow_none=True)
    amount = fields.Str(required=True)  # Will be encrypted before storage
    currency = fields.Str(validate=validate.Length(equal=3))
    start_date = fields.Date(required=True)
    end_date = fields.Date(required=True)
    auto_renewal = fields.Bool()
    status = fields.Str(validate=validate.OneOf(['draft', 'active', 'expired', 'terminated', 'renewed']))
    contact_email = fields.Email(allow_none=True)
    contact_phone = fields.Str(allow_none=True, validate=validate.Length(max=50))
    notes = fields.Str(allow_none=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class ContractHistorySchema(Schema):
    """Contract history schema"""
    id = fields.Int(dump_only=True)
    contract_id = fields.Int(required=True)
    action = fields.Str(validate=validate.OneOf(['created', 'updated', 'renewed', 'terminated']))
    changes = fields.Dict(allow_none=True)
    notes = fields.Str(allow_none=True)
    created_at = fields.DateTime(dump_only=True)
    created_by = fields.Int(dump_only=True)
