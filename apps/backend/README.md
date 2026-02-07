# MsspBizCenter Backend (Flask)

Flask-based REST API for MSSP Business Center.

## Tech Stack

- **Framework**: Flask 3.0
- **ORM**: SQLAlchemy 2.x
- **Database**: MariaDB (MySQL compatible)
- **Authentication**: Flask-JWT-Extended
- **API Documentation**: Flask-RESTX (Swagger)
- **Validation**: Marshmallow
- **Encryption**: AES-256-GCM (cryptography)

## Setup

### 1. Virtual Environment

```bash
cd apps/backend
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

**Important variables:**
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - Database connection
- `JWT_SECRET_KEY` - JWT signing key (change in production!)
- `CONTRACT_ENCRYPTION_KEY` - AES encryption key (minimum 32 characters)
- `CORS_ORIGINS` - Allowed frontend origins

### 4. Database Initialization

```bash
# Create database tables
flask db upgrade

# Or manually create tables
python
>>> from app import create_app
>>> from app.extensions import db
>>> app = create_app()
>>> with app.app_context():
...     db.create_all()
```

### 5. Run Development Server

```bash
flask run --port 4001
# or
python run.py
```

API will be available at: http://localhost:4001/api/v1

Swagger documentation: http://localhost:4001/api/docs

## API Endpoints

### Authentication (`/api/v1/auth`)

- `POST /login` - User login
- `POST /register` - User registration
- `POST /refresh` - Refresh access token
- `GET /me` - Get current user info

### Tasks (`/api/v1/tasks`)

- `GET /tasks` - List tasks (with filters: week, year, status, assigned_to)
- `POST /tasks` - Create task
- `GET /tasks/<id>` - Get task by ID
- `PUT /tasks/<id>` - Update task
- `DELETE /tasks/<id>` - Delete task

### Meetings (`/api/v1/meetings`)

- `GET /meetings` - List meetings (with filters: status, from_date, to_date)
- `POST /meetings` - Create meeting
- `GET /meetings/<id>` - Get meeting by ID
- `PUT /meetings/<id>` - Update meeting
- `DELETE /meetings/<id>` - Delete meeting

### Contracts (`/api/v1/contracts`)

- `GET /contracts` - List contracts (requires Editor+)
- `POST /contracts` - Create contract (requires Admin+)
- `GET /contracts/<id>` - Get contract by ID (requires Editor+)
- `PUT /contracts/<id>` - Update contract (requires Admin+)
- `DELETE /contracts/<id>` - Delete contract (requires Owner)

**Note:** Contract amounts are encrypted. Only Owner/Admin roles can view decrypted amounts.

## Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **owner** | Full access (all CRUD + delete contracts) |
| **admin** | Manage tasks, meetings, contracts (view amounts) |
| **editor** | Manage tasks, meetings, view contracts |
| **analyst** | View tasks, meetings |
| **viewer** | View tasks, meetings |

## Multi-Tenancy

All data is isolated by `tenant_id`:
- JWT tokens include `tenant_id`
- All queries automatically filter by tenant
- Users can only access data within their tenant

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app tests/

# Run specific test file
pytest tests/test_auth.py
```

## Database Migrations

```bash
# Initialize migrations (first time only)
flask db init

# Generate migration after model changes
flask db migrate -m "Description of changes"

# Apply migrations
flask db upgrade

# Rollback last migration
flask db downgrade
```

## Project Structure

```
apps/backend/
├── app/
│   ├── __init__.py          # Flask app factory
│   ├── config.py            # Configuration
│   ├── extensions.py        # Flask extensions
│   ├── models/              # SQLAlchemy models
│   │   ├── base.py          # Base model (tenant_id, timestamps)
│   │   ├── user.py          # User model
│   │   ├── task.py          # Task, TaskComment
│   │   ├── meeting.py       # Meeting, MeetingAttendee, ActionItem
│   │   └── contract.py      # Contract, ContractHistory
│   ├── api/                 # REST API endpoints
│   │   ├── auth.py          # Authentication
│   │   ├── tasks.py         # Tasks CRUD
│   │   ├── meetings.py      # Meetings CRUD
│   │   └── contracts.py     # Contracts CRUD
│   ├── schemas/             # Marshmallow validation schemas
│   ├── services/            # Business logic
│   │   └── encryption.py    # AES-256-GCM encryption
│   └── utils/               # Utilities
│       └── decorators.py    # tenant_required, role_required
├── tests/                   # Unit and integration tests
├── migrations/              # Alembic migrations
├── requirements.txt         # Python dependencies
├── .env.example            # Environment variables template
└── run.py                  # Application entry point
```

## Example API Usage

### 1. Register User

```bash
curl -X POST http://localhost:4001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@msspbiz.local",
    "password": "Admin@1234!",
    "name": "Admin User",
    "tenant_id": "msspbiz-tenant-1"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:4001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@msspbiz.local",
    "password": "Admin@1234!"
  }'
```

Response:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "email": "admin@msspbiz.local",
    "name": "Admin User",
    "role": "viewer"
  }
}
```

### 3. Create Task (with JWT)

```bash
curl -X POST http://localhost:4001/api/v1/tasks \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "API 개발",
    "description": "Task API CRUD 구현",
    "status": "in_progress",
    "priority": "high",
    "week_number": 6,
    "year": 2026,
    "tags": ["backend", "api"]
  }'
```

### 4. List Tasks

```bash
curl -X GET "http://localhost:4001/api/v1/tasks?week=6&year=2026" \
  -H "Authorization: Bearer <access_token>"
```

## License

Proprietary - MSSP BizCenter
