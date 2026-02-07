"""Task Schemas"""
from marshmallow import Schema, fields, validate


class TaskSchema(Schema):
    """Task schema for serialization/validation"""
    id = fields.Int(dump_only=True)
    tenant_id = fields.Str(dump_only=True)
    title = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    description = fields.Str(allow_none=True)
    status = fields.Str(validate=validate.OneOf(['pending', 'in_progress', 'review', 'completed', 'cancelled']))
    priority = fields.Str(validate=validate.OneOf(['low', 'medium', 'high', 'urgent']))
    assigned_to = fields.Int(allow_none=True)
    due_date = fields.DateTime(allow_none=True)
    week_number = fields.Int(required=True, validate=validate.Range(min=1, max=53))
    year = fields.Int(required=True, validate=validate.Range(min=2020, max=2100))
    tags = fields.List(fields.Str(), allow_none=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    created_by = fields.Int(dump_only=True)


class TaskCommentSchema(Schema):
    """Task comment schema"""
    id = fields.Int(dump_only=True)
    task_id = fields.Int(required=True)
    content = fields.Str(required=True, validate=validate.Length(min=1))
    created_at = fields.DateTime(dump_only=True)
