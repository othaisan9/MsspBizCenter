"""Contract Model"""
from app.extensions import db
from .base import BaseModel


class Contract(BaseModel):
    """Contract management model with encrypted amount"""
    __tablename__ = 'contracts'

    contract_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    customer_name = db.Column(db.String(255), nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)

    # Encrypted field (stored as base64)
    amount_encrypted = db.Column(db.Text, nullable=False)

    currency = db.Column(db.String(3), default='KRW', nullable=False)  # ISO 4217
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False, index=True)
    auto_renewal = db.Column(db.Boolean, default=False, nullable=False)

    status = db.Column(
        db.Enum('draft', 'active', 'expired', 'terminated', 'renewed', name='contract_status'),
        default='draft',
        nullable=False,
        index=True
    )

    contact_email = db.Column(db.String(255), nullable=True)
    contact_phone = db.Column(db.String(50), nullable=True)
    notes = db.Column(db.Text, nullable=True)

    # Notification flags
    notified_30days = db.Column(db.Boolean, default=False, nullable=False)
    notified_7days = db.Column(db.Boolean, default=False, nullable=False)

    # Relationships
    history = db.relationship('ContractHistory', backref='contract', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self, decrypt_amount=False):
        """
        Convert contract to dictionary

        Args:
            decrypt_amount: If True, decrypt and include amount (requires proper role)
        """
        data = {
            'id': self.id,
            'tenant_id': self.tenant_id,
            'contract_number': self.contract_number,
            'customer_name': self.customer_name,
            'title': self.title,
            'description': self.description,
            'currency': self.currency,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'auto_renewal': self.auto_renewal,
            'status': self.status,
            'contact_email': self.contact_email,
            'contact_phone': self.contact_phone,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

        if decrypt_amount:
            from app.services.encryption import EncryptionService
            encryption_service = EncryptionService()
            try:
                data['amount'] = encryption_service.decrypt(self.amount_encrypted)
            except Exception:
                data['amount'] = None  # Decryption failed
        else:
            data['amount'] = '***'  # Masked for non-privileged users

        return data

    def __repr__(self):
        return f'<Contract {self.contract_number}: {self.customer_name}>'


class ContractHistory(BaseModel):
    """Contract change history"""
    __tablename__ = 'contract_history'

    contract_id = db.Column(db.Integer, db.ForeignKey('contracts.id'), nullable=False, index=True)
    action = db.Column(
        db.Enum('created', 'updated', 'renewed', 'terminated', name='contract_action'),
        nullable=False
    )
    changes = db.Column(db.JSON, nullable=True)  # {"field": "old_value -> new_value"}
    notes = db.Column(db.Text, nullable=True)

    def to_dict(self):
        """Convert history to dictionary"""
        return {
            'id': self.id,
            'contract_id': self.contract_id,
            'action': self.action,
            'changes': self.changes or {},
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'created_by': self.created_by
        }

    def __repr__(self):
        return f'<ContractHistory {self.id}: {self.action} on Contract {self.contract_id}>'
