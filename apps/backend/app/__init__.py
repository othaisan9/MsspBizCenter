"""Flask Application Factory"""
from flask import Flask
from flask_cors import CORS
from flask_restx import Api

from .extensions import db, jwt, migrate
from .config import DevelopmentConfig, ProductionConfig, TestConfig


def create_app(config_name='development'):
    """
    Create and configure Flask application

    Args:
        config_name: 'development', 'production', or 'test'

    Returns:
        Flask app instance
    """
    app = Flask(__name__)

    # Load configuration
    config_map = {
        'development': DevelopmentConfig,
        'production': ProductionConfig,
        'test': TestConfig
    }
    app.config.from_object(config_map.get(config_name, DevelopmentConfig))

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app, origins=app.config['CORS_ORIGINS'])

    # Initialize Flask-RESTX API with Swagger
    api = Api(
        app,
        version=app.config['API_VERSION'],
        title=app.config['API_TITLE'],
        description=app.config['API_DESCRIPTION'],
        doc='/api/docs',
        prefix='/api/v1'
    )

    # Register namespaces
    from .api.auth import api as auth_ns
    from .api.tasks import api as tasks_ns
    from .api.meetings import api as meetings_ns
    from .api.contracts import api as contracts_ns

    api.add_namespace(auth_ns, path='/auth')
    api.add_namespace(tasks_ns, path='/tasks')
    api.add_namespace(meetings_ns, path='/meetings')
    api.add_namespace(contracts_ns, path='/contracts')

    # Create tables in development mode (for testing without migrations)
    if config_name == 'development':
        with app.app_context():
            try:
                db.create_all()
            except Exception as e:
                app.logger.warning(f"Could not create tables: {e}")

    # Health check endpoint
    @app.route('/health')
    def health_check():
        return {'status': 'healthy', 'version': app.config['API_VERSION']}, 200

    return app
