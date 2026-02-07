"""Task Model"""
from app.extensions import db
from .base import BaseModel


class Task(BaseModel):
    """Weekly task management model"""
    __tablename__ = 'tasks'

    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(
        db.Enum('pending', 'in_progress', 'review', 'completed', 'cancelled', name='task_status'),
        default='pending',
        nullable=False,
        index=True
    )
    priority = db.Column(
        db.Enum('low', 'medium', 'high', 'urgent', name='task_priority'),
        default='medium',
        nullable=False
    )
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    due_date = db.Column(db.DateTime, nullable=True)
    week_number = db.Column(db.Integer, nullable=False, index=True)  # ISO week number
    year = db.Column(db.Integer, nullable=False, index=True)
    tags = db.Column(db.JSON, nullable=True)  # ["backend", "api", "urgent"]

    # Relationships
    comments = db.relationship('TaskComment', backref='task', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        """Convert task to dictionary"""
        return {
            'id': self.id,
            'tenant_id': self.tenant_id,
            'title': self.title,
            'description': self.description,
            'status': self.status,
            'priority': self.priority,
            'assigned_to': self.assigned_to,
            'assignee': self.assignee.to_dict(include_email=False) if self.assignee else None,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'week_number': self.week_number,
            'year': self.year,
            'tags': self.tags or [],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'created_by': self.created_by
        }

    def __repr__(self):
        return f'<Task {self.id}: {self.title}>'


class TaskComment(BaseModel):
    """Task comment model"""
    __tablename__ = 'task_comments'

    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=False, index=True)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)

    def to_dict(self):
        """Convert comment to dictionary"""
        return {
            'id': self.id,
            'task_id': self.task_id,
            'author': self.author.to_dict(include_email=False) if self.author else None,
            'content': self.content,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<TaskComment {self.id} on Task {self.task_id}>'
