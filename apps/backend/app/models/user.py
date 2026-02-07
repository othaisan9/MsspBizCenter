"""User Model"""
from werkzeug.security import generate_password_hash, check_password_hash
from app.extensions import db
from .base import BaseModel


class User(BaseModel):
    """User model for authentication and authorization"""
    __tablename__ = 'users'

    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(
        db.Enum('owner', 'admin', 'editor', 'analyst', 'viewer', name='user_role'),
        default='viewer',
        nullable=False
    )
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    last_login = db.Column(db.DateTime, nullable=True)

    # Relationships
    tasks = db.relationship('Task', foreign_keys='Task.assigned_to', backref='assignee', lazy='dynamic')
    comments = db.relationship('TaskComment', foreign_keys='TaskComment.author_id', backref='author', lazy='dynamic')

    def set_password(self, password):
        """Hash and set user password"""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Verify password against hash"""
        return check_password_hash(self.password_hash, password)

    def to_dict(self, include_email=True):
        """Convert user to dict (exclude password_hash)"""
        data = {
            'id': self.id,
            'name': self.name,
            'role': self.role,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }
        if include_email:
            data['email'] = self.email
        return data

    def __repr__(self):
        return f'<User {self.email}>'
