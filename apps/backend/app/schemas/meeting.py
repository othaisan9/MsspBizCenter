"""Meeting Schemas"""
from marshmallow import Schema, fields, validate


class MeetingSchema(Schema):
    """Meeting schema for serialization/validation"""
    id = fields.Int(dump_only=True)
    tenant_id = fields.Str(dump_only=True)
    title = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    meeting_date = fields.DateTime(required=True)
    location = fields.Str(allow_none=True, validate=validate.Length(max=255))
    agenda = fields.Str(allow_none=True)
    notes = fields.Str(allow_none=True)
    decisions = fields.Str(allow_none=True)
    status = fields.Str(validate=validate.OneOf(['draft', 'published', 'archived']))
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class ActionItemSchema(Schema):
    """Action item schema"""
    id = fields.Int(dump_only=True)
    meeting_id = fields.Int(required=True)
    task_id = fields.Int(allow_none=True)
    description = fields.Str(required=True, validate=validate.Length(min=1))
    assigned_to = fields.Int(allow_none=True)
    due_date = fields.DateTime(allow_none=True)
    status = fields.Str(validate=validate.OneOf(['pending', 'in_progress', 'completed']))
    created_at = fields.DateTime(dump_only=True)
