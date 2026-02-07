"""Decorators for Access Control"""
from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity, get_jwt, verify_jwt_in_request


def tenant_required(f):
    """
    Decorator to enforce tenant isolation

    Extracts tenant_id from JWT and makes it available via g.tenant_id
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        verify_jwt_in_request()
        user_id_str = get_jwt_identity()
        claims = get_jwt()

        if not claims or 'tenant_id' not in claims:
            return jsonify({'error': 'Missing tenant_id in token'}), 403

        # Store tenant_id in Flask g for use in routes
        from flask import g
        g.tenant_id = claims['tenant_id']
        g.user_id = claims.get('user_id', int(user_id_str))  # Use user_id from claims or convert identity
        g.user_role = claims.get('role', 'viewer')

        return f(*args, **kwargs)

    return decorated_function


def role_required(*allowed_roles):
    """
    Decorator to enforce role-based access control

    Usage:
        @role_required('admin', 'owner')
        def protected_route():
            ...

    Args:
        allowed_roles: Tuple of allowed role names
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()

            user_role = claims.get('role', 'viewer')

            if user_role not in allowed_roles:
                return jsonify({
                    'error': 'Insufficient permissions',
                    'required_roles': list(allowed_roles),
                    'your_role': user_role
                }), 403

            return f(*args, **kwargs)

        return decorated_function

    return decorator
