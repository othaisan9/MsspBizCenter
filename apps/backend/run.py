#!/usr/bin/env python3
"""Flask Application Entry Point"""
import os
from dotenv import load_dotenv
from app import create_app

# Load environment variables
load_dotenv()

# Create Flask app
app = create_app(os.getenv('FLASK_ENV', 'development'))

if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=int(os.getenv('FLASK_PORT', 4001)),
        debug=os.getenv('FLASK_ENV') == 'development'
    )
