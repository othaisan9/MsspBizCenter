"""Meetings API"""
from flask import request, g
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required
from marshmallow import ValidationError

from app.extensions import db
from app.models import Meeting
from app.schemas import MeetingSchema
from app.utils.decorators import tenant_required

api = Namespace('meetings', description='Meeting management operations')

# Swagger models
meeting_model = api.model('Meeting', {
    'id': fields.Integer(readonly=True, description='Meeting ID'),
    'title': fields.String(required=True, description='Meeting title'),
    'meeting_date': fields.DateTime(required=True, description='Meeting date/time'),
    'location': fields.String(description='Meeting location'),
    'agenda': fields.String(description='Meeting agenda'),
    'notes': fields.String(description='Meeting notes'),
    'decisions': fields.String(description='Decisions made'),
    'status': fields.String(description='Status', enum=['draft', 'published', 'archived'])
})


@api.route('')
class MeetingList(Resource):
    @api.doc('list_meetings', security='jwt')
    @api.param('status', 'Filter by status')
    @api.param('from_date', 'Filter meetings from date (ISO format)')
    @api.param('to_date', 'Filter meetings to date (ISO format)')
    @api.response(200, 'Success')
    @jwt_required()
    @tenant_required
    def get(self):
        """List all meetings for current tenant"""
        query = Meeting.query.filter_by(tenant_id=g.tenant_id)

        # Apply filters
        if 'status' in request.args:
            query = query.filter_by(status=request.args['status'])
        if 'from_date' in request.args:
            query = query.filter(Meeting.meeting_date >= request.args['from_date'])
        if 'to_date' in request.args:
            query = query.filter(Meeting.meeting_date <= request.args['to_date'])

        meetings = query.order_by(Meeting.meeting_date.desc()).all()

        return {
            'meetings': [meeting.to_dict() for meeting in meetings],
            'total': len(meetings)
        }, 200

    @api.doc('create_meeting', security='jwt')
    @api.expect(meeting_model)
    @api.response(201, 'Meeting created')
    @api.response(400, 'Validation error')
    @jwt_required()
    @tenant_required
    def post(self):
        """Create a new meeting"""
        schema = MeetingSchema()
        try:
            data = schema.load(request.json)
        except ValidationError as e:
            return {'errors': e.messages}, 400

        meeting = Meeting(
            tenant_id=g.tenant_id,
            created_by=g.user_id,
            **data
        )

        db.session.add(meeting)
        db.session.commit()

        return {
            'message': 'Meeting created successfully',
            'meeting': meeting.to_dict()
        }, 201


@api.route('/<int:meeting_id>')
@api.param('meeting_id', 'Meeting ID')
class MeetingDetail(Resource):
    @api.doc('get_meeting', security='jwt')
    @api.response(200, 'Success')
    @api.response(404, 'Meeting not found')
    @jwt_required()
    @tenant_required
    def get(self, meeting_id):
        """Get meeting by ID"""
        meeting = Meeting.query.filter_by(id=meeting_id, tenant_id=g.tenant_id).first()

        if not meeting:
            return {'error': 'Meeting not found'}, 404

        return {'meeting': meeting.to_dict()}, 200

    @api.doc('update_meeting', security='jwt')
    @api.expect(meeting_model)
    @api.response(200, 'Meeting updated')
    @api.response(404, 'Meeting not found')
    @jwt_required()
    @tenant_required
    def put(self, meeting_id):
        """Update meeting by ID"""
        meeting = Meeting.query.filter_by(id=meeting_id, tenant_id=g.tenant_id).first()

        if not meeting:
            return {'error': 'Meeting not found'}, 404

        schema = MeetingSchema(partial=True)
        try:
            data = schema.load(request.json)
        except ValidationError as e:
            return {'errors': e.messages}, 400

        for key, value in data.items():
            setattr(meeting, key, value)

        db.session.commit()

        return {
            'message': 'Meeting updated successfully',
            'meeting': meeting.to_dict()
        }, 200

    @api.doc('delete_meeting', security='jwt')
    @api.response(204, 'Meeting deleted')
    @api.response(404, 'Meeting not found')
    @jwt_required()
    @tenant_required
    def delete(self, meeting_id):
        """Delete meeting by ID"""
        meeting = Meeting.query.filter_by(id=meeting_id, tenant_id=g.tenant_id).first()

        if not meeting:
            return {'error': 'Meeting not found'}, 404

        db.session.delete(meeting)
        db.session.commit()

        return '', 204
