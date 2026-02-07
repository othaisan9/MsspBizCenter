"""Tasks API"""
from flask import request, g
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required
from marshmallow import ValidationError

from app.extensions import db
from app.models import Task
from app.schemas import TaskSchema
from app.utils.decorators import tenant_required

api = Namespace('tasks', description='Task management operations')

# Swagger models
task_model = api.model('Task', {
    'id': fields.Integer(readonly=True, description='Task ID'),
    'title': fields.String(required=True, description='Task title'),
    'description': fields.String(description='Task description'),
    'status': fields.String(description='Task status', enum=['pending', 'in_progress', 'review', 'completed', 'cancelled']),
    'priority': fields.String(description='Task priority', enum=['low', 'medium', 'high', 'urgent']),
    'assigned_to': fields.Integer(description='Assigned user ID'),
    'due_date': fields.DateTime(description='Due date'),
    'week_number': fields.Integer(required=True, description='ISO week number (1-53)'),
    'year': fields.Integer(required=True, description='Year'),
    'tags': fields.List(fields.String, description='Task tags')
})


@api.route('')
class TaskList(Resource):
    @api.doc('list_tasks', security='jwt')
    @api.param('week', 'Filter by week number', type=int)
    @api.param('year', 'Filter by year', type=int)
    @api.param('status', 'Filter by status')
    @api.param('assigned_to', 'Filter by assigned user ID', type=int)
    @api.response(200, 'Success')
    @jwt_required()
    @tenant_required
    def get(self):
        """List all tasks for current tenant"""
        query = Task.query.filter_by(tenant_id=g.tenant_id)

        # Apply filters
        if 'week' in request.args:
            query = query.filter_by(week_number=int(request.args['week']))
        if 'year' in request.args:
            query = query.filter_by(year=int(request.args['year']))
        if 'status' in request.args:
            query = query.filter_by(status=request.args['status'])
        if 'assigned_to' in request.args:
            query = query.filter_by(assigned_to=int(request.args['assigned_to']))

        tasks = query.order_by(Task.created_at.desc()).all()

        return {
            'tasks': [task.to_dict() for task in tasks],
            'total': len(tasks)
        }, 200

    @api.doc('create_task', security='jwt')
    @api.expect(task_model)
    @api.response(201, 'Task created')
    @api.response(400, 'Validation error')
    @jwt_required()
    @tenant_required
    def post(self):
        """Create a new task"""
        schema = TaskSchema()
        try:
            data = schema.load(request.json)
        except ValidationError as e:
            return {'errors': e.messages}, 400

        task = Task(
            tenant_id=g.tenant_id,
            created_by=g.user_id,
            **data
        )

        db.session.add(task)
        db.session.commit()

        return {
            'message': 'Task created successfully',
            'task': task.to_dict()
        }, 201


@api.route('/<int:task_id>')
@api.param('task_id', 'Task ID')
class TaskDetail(Resource):
    @api.doc('get_task', security='jwt')
    @api.response(200, 'Success')
    @api.response(404, 'Task not found')
    @jwt_required()
    @tenant_required
    def get(self, task_id):
        """Get task by ID"""
        task = Task.query.filter_by(id=task_id, tenant_id=g.tenant_id).first()

        if not task:
            return {'error': 'Task not found'}, 404

        return {'task': task.to_dict()}, 200

    @api.doc('update_task', security='jwt')
    @api.expect(task_model)
    @api.response(200, 'Task updated')
    @api.response(404, 'Task not found')
    @jwt_required()
    @tenant_required
    def put(self, task_id):
        """Update task by ID"""
        task = Task.query.filter_by(id=task_id, tenant_id=g.tenant_id).first()

        if not task:
            return {'error': 'Task not found'}, 404

        schema = TaskSchema(partial=True)
        try:
            data = schema.load(request.json)
        except ValidationError as e:
            return {'errors': e.messages}, 400

        for key, value in data.items():
            setattr(task, key, value)

        db.session.commit()

        return {
            'message': 'Task updated successfully',
            'task': task.to_dict()
        }, 200

    @api.doc('delete_task', security='jwt')
    @api.response(204, 'Task deleted')
    @api.response(404, 'Task not found')
    @jwt_required()
    @tenant_required
    def delete(self, task_id):
        """Delete task by ID"""
        task = Task.query.filter_by(id=task_id, tenant_id=g.tenant_id).first()

        if not task:
            return {'error': 'Task not found'}, 404

        db.session.delete(task)
        db.session.commit()

        return '', 204
