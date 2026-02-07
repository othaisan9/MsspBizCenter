"""Flask Extensions Initialization"""
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager

# Initialize extensions (actual init in app factory)
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
