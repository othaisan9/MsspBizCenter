"""Pytest configuration and fixtures"""
import pytest
from app import create_app
from app.extensions import db as _db
from app.models import User


@pytest.fixture(scope='session')
def app():
    """Create Flask app for testing"""
    app = create_app('test')
    return app


@pytest.fixture(scope='function')
def db(app):
    """Create database tables for testing"""
    with app.app_context():
        _db.create_all()
        yield _db
        _db.session.remove()
        _db.drop_all()


@pytest.fixture(scope='function')
def client(app, db):
    """Create Flask test client"""
    return app.test_client()


@pytest.fixture(scope='function')
def test_user(db):
    """Create test user"""
    user = User(
        email='test@example.com',
        name='Test User',
        tenant_id='test-tenant',
        role='admin'
    )
    user.set_password('TestPassword123!')
    db.session.add(user)
    db.session.commit()
    return user
