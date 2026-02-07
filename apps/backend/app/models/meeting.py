"""Meeting Model"""
from app.extensions import db
from .base import BaseModel


class Meeting(BaseModel):
    """Meeting note model"""
    __tablename__ = 'meetings'

    title = db.Column(db.String(255), nullable=False)
    meeting_date = db.Column(db.DateTime, nullable=False, index=True)
    location = db.Column(db.String(255), nullable=True)
    agenda = db.Column(db.Text, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    decisions = db.Column(db.Text, nullable=True)
    status = db.Column(
        db.Enum('draft', 'published', 'archived', name='meeting_status'),
        default='draft',
        nullable=False
    )

    # Relationships
    attendees = db.relationship('MeetingAttendee', backref='meeting', lazy='dynamic', cascade='all, delete-orphan')
    action_items = db.relationship('ActionItem', backref='meeting', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        """Convert meeting to dictionary"""
        return {
            'id': self.id,
            'tenant_id': self.tenant_id,
            'title': self.title,
            'meeting_date': self.meeting_date.isoformat() if self.meeting_date else None,
            'location': self.location,
            'agenda': self.agenda,
            'notes': self.notes,
            'decisions': self.decisions,
            'status': self.status,
            'attendees': [a.to_dict() for a in self.attendees],
            'action_items': [ai.to_dict() for ai in self.action_items],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f'<Meeting {self.id}: {self.title}>'


class MeetingAttendee(BaseModel):
    """Meeting attendee model"""
    __tablename__ = 'meeting_attendees'

    meeting_id = db.Column(db.Integer, db.ForeignKey('meetings.id'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    role = db.Column(db.String(50), nullable=True)  # 'organizer', 'participant'

    def to_dict(self):
        """Convert attendee to dictionary"""
        from .user import User
        user = User.query.get(self.user_id)
        return {
            'id': self.id,
            'meeting_id': self.meeting_id,
            'user_id': self.user_id,
            'user_name': user.name if user else None,
            'role': self.role
        }

    def __repr__(self):
        return f'<MeetingAttendee {self.user_id} in Meeting {self.meeting_id}>'


class ActionItem(BaseModel):
    """Action item from meeting"""
    __tablename__ = 'action_items'

    meeting_id = db.Column(db.Integer, db.ForeignKey('meetings.id'), nullable=False, index=True)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=True)  # Link to Task
    description = db.Column(db.Text, nullable=False)
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    due_date = db.Column(db.DateTime, nullable=True)
    status = db.Column(
        db.Enum('pending', 'in_progress', 'completed', name='action_item_status'),
        default='pending',
        nullable=False
    )

    def to_dict(self):
        """Convert action item to dictionary"""
        from .user import User
        user = User.query.get(self.assigned_to) if self.assigned_to else None
        return {
            'id': self.id,
            'meeting_id': self.meeting_id,
            'task_id': self.task_id,
            'description': self.description,
            'assigned_to': self.assigned_to,
            'assignee_name': user.name if user else None,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<ActionItem {self.id} from Meeting {self.meeting_id}>'
