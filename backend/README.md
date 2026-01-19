# Website Time Tracker Backend

FastAPI server with SQLite database for tracking website usage over time. Provides API endpoints for syncing usage data, viewing historical calendar data, and managing tracked sites.

## Setup

### Prerequisites

Install uv:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
# or: brew install uv
```

Install Python 3.10+ (if needed):
```bash
uv python install 3.14
```

### Setup

```bash
cd backend
./setup.sh
```

### Database Migration

**⚠️ IMPORTANT: Run this before starting the server for the first time!**

The database tables must be created manually. This is a **destructive operation** that will destroy any existing database and create a fresh one.

```bash
cd backend
./migrate.sh
```

This script will:
1. Drop all existing tables (if any)
2. Create all tables from models
3. Create indexes for performance

**Note:** The database file is created at `./website_tracker.db` by default. You can change this by setting the `DATABASE_URL` environment variable.

## Running the Server

```bash
cd backend
./run.sh
```

Or manually:
```bash
uv run python -m website_tracker_backend
```

Server runs on `http://localhost:8000`

## Architecture

The backend follows a **layered architecture** (Hexagonal Architecture):

```
backend/website_tracker_backend/
├── application/          # Application Layer (HTTP/API)
│   ├── routers/          # API endpoints, validation only
│   │   ├── usage.py
│   │   └── tracked_sites.py
│   ├── schemas.py        # Pydantic request/response models
│   └── dependencies.py   # Dependency injection
├── domain/               # Domain Layer (Business Logic)
│   ├── interfaces/       # Repository interfaces (ports)
│   │   ├── usage_repository.py
│   │   ├── tracked_sites_repository.py
│   │   └── user_repository.py
│   └── services/         # Domain services (business logic)
│       ├── usage_service.py
│       └── tracked_sites_service.py
└── infrastructure/       # Infrastructure Layer
    ├── database/         # Database models and connection
    │   ├── models.py     # SQLAlchemy models
    │   └── connection.py # Database connection
    └── adapters/         # Repository implementations
        ├── usage_repository_impl.py
        ├── tracked_sites_repository_impl.py
        └── user_repository_impl.py
```

### Architecture Benefits

- **Separation of Concerns**: HTTP, business logic, and data access are separated
- **Testability**: Domain services can be tested with mock repositories
- **Maintainability**: Business logic is independent of database/HTTP
- **Flexibility**: Easy to swap implementations (e.g., different database)

## API Endpoints

All API endpoints require the `X-User-ID` header with a user UUID.

### POST /limit-reached

Receives notifications when a website time limit is reached.

**Request Body:**
```json
{
  "domain": "youtube.com",
  "minutes": 60,
  "timestamp": "2023-10-27T12:00:00"
}
```

**Response:**
```json
{
  "status": "received",
  "domain": "youtube.com",
  "minutes": 60,
  "timestamp": "2023-10-27T12:00:00"
}
```

### POST /api/usage/sync

Sync daily usage data from extension to backend.

**Headers:**
```
X-User-ID: <user-uuid>
Content-Type: application/json
```

**Request Body:**
```json
{
  "date": "2024-01-15",
  "usage": {
    "youtube.com": 45.5,
    "reddit.com": 30.0
  }
}
```

**Response:**
```json
{
  "status": "success",
  "synced": 2,
  "date": "2024-01-15"
}
```

### GET /api/usage/calendar

Get calendar month data with usage information.

**Headers:**
```
X-User-ID: <user-uuid>
```

**Query Parameters:**
- `year`: Year (e.g., 2024)
- `month`: Month (1-12)

**Response:**
```json
{
  "year": 2024,
  "month": 1,
  "days": [
    {
      "date": "2024-01-15",
      "totalUsage": 75.5,
      "domainUsage": {
        "youtube.com": 45.5,
        "reddit.com": 30.0
      },
      "limitReached": false,
      "domains": [
        {
          "domain": "youtube.com",
          "minutes": 45.5,
          "limit": 60,
          "limitReached": false,
          "percentage": 75.8
        },
        {
          "domain": "reddit.com",
          "minutes": 30.0,
          "limit": 30,
          "limitReached": true,
          "percentage": 100.0
        }
      ]
    }
  ]
}
```

### GET /api/usage/day

Get detailed usage information for a specific day.

**Headers:**
```
X-User-ID: <user-uuid>
```

**Query Parameters:**
- `date_str`: Date in YYYY-MM-DD format

**Response:**
```json
{
  "date": "2024-01-15",
  "totalUsage": 75.5,
  "totalLimit": 90,
  "domains": [
    {
      "domain": "youtube.com",
      "minutes": 45.5,
      "limit": 60,
      "limitReached": false,
      "percentage": 75.8
    }
  ],
  "metrics": {
    "totalMinutes": 75.5,
    "totalLimit": 90,
    "totalPercentage": 83.9,
    "domainsOverLimit": 0,
    "domainsTracked": 2
  }
}
```

### POST /api/tracked-sites/sync

Sync tracked sites from extension to backend.

**Headers:**
```
X-User-ID: <user-uuid>
Content-Type: application/json
```

**Request Body:**
```json
{
  "trackedSites": {
    "youtube.com": 60,
    "reddit.com": 30
  }
}
```

**Response:**
```json
{
  "status": "success",
  "synced": 2
}
```

### GET /api/tracked-sites

Get all tracked sites for a user.

**Headers:**
```
X-User-ID: <user-uuid>
```

**Response:**
```json
{
  "trackedSites": {
    "youtube.com": 60,
    "reddit.com": 30
  }
}
```

## Database Schema

The database uses SQLite with the following schema:

### Tables

#### users
```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,  -- UUID as string
    email TEXT UNIQUE,    -- Optional: for future email features
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### tracked_sites
```sql
CREATE TABLE tracked_sites (
    id TEXT PRIMARY KEY,  -- UUID as string
    user_id TEXT NOT NULL,
    domain TEXT NOT NULL,
    daily_limit INTEGER NOT NULL,  -- minutes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, domain)  -- One limit per domain per user
);
```

#### usage_records
```sql
CREATE TABLE usage_records (
    id TEXT PRIMARY KEY,  -- UUID as string
    user_id TEXT NOT NULL,
    domain TEXT NOT NULL,
    date DATE NOT NULL,  -- YYYY-MM-DD format
    minutes REAL NOT NULL,  -- Can be fractional (e.g., 1.5 minutes)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, domain, date)  -- One record per domain per day per user
);
```

### Indexes

For performance optimization:

```sql
CREATE INDEX idx_usage_records_user_date ON usage_records(user_id, date);
CREATE INDEX idx_usage_records_user_domain_date ON usage_records(user_id, domain, date);
CREATE INDEX idx_tracked_sites_user ON tracked_sites(user_id);
```

These indexes are automatically created by the migration script.

## Testing

### Running Tests

```bash
cd backend
uv run pytest __tests__/ -v
```

### Test Structure

- **`__tests__/domain/`**: Domain service tests (use mocks, no database)
- **`__tests__/infrastructure/`**: Repository implementation tests (use real database)
- **`__tests__/test_*_router.py`**: API endpoint integration tests
- **`__tests__/test_database.py`**: Database model tests

### Test Coverage

- Domain services: Tested with mocked repositories
- Infrastructure adapters: Tested with in-memory SQLite database
- API routers: Integration tests with test client

## CORS

The API is configured to accept requests from Chrome extensions. The current configuration allows all origins (`*`). In production, you may want to restrict this to specific extension IDs:

```python
allow_origins=["chrome-extension://your-extension-id"]
```

