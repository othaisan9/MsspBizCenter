"""Flask Configuration"""
import os
from datetime import timedelta


class Config:
    """Base configuration"""
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')

    # Database
    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://{os.getenv('DB_USER', 'root')}:"
        f"{os.getenv('DB_PASSWORD', 'password')}@"
        f"{os.getenv('DB_HOST', 'localhost')}:"
        f"{os.getenv('DB_PORT', '3307')}/"
        f"{os.getenv('DB_NAME', 'msspbiz')}?charset=utf8mb4"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False

    # JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        seconds=int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 3600))
    )
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(
        seconds=int(os.getenv('JWT_REFRESH_TOKEN_EXPIRES', 604800))
    )

    # CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3001').split(',')

    # Encryption
    CONTRACT_ENCRYPTION_KEY = os.getenv(
        'CONTRACT_ENCRYPTION_KEY',
        'change-this-to-32-character-key!!'
    )

    # Audit
    AUDIT_RETENTION_DAYS = int(os.getenv('AUDIT_RETENTION_DAYS', 90))

    # API
    API_VERSION = 'v1'
    API_TITLE = 'MSSP BizCenter API'
    API_DESCRIPTION = 'MSSP Business Center - Task, Meeting, Contract Management'


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    SQLALCHEMY_ECHO = True

    # Use SQLite for local development if DB not configured
    if not os.getenv('DB_HOST') or os.getenv('USE_SQLITE') == 'true':
        SQLALCHEMY_DATABASE_URI = 'sqlite:///msspbiz_dev.db'


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    SQLALCHEMY_ECHO = False


class TestConfig(Config):
    """Test configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
