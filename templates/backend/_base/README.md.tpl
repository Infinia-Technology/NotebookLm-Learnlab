# {{APP_NAME}}

{{DESCRIPTION}}

## Overview

- **Template**: {{TEMPLATE_TYPE}}
- **Generated**: {{GENERATED_AT}}
- **Slug**: {{SLUG_KEBAB}}

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/{{SLUG_KEBAB}}` | Create a new item |
| GET | `/api/{{SLUG_KEBAB}}` | List all items |
| GET | `/api/{{SLUG_KEBAB}}/{id}` | Get item by ID |
| PATCH | `/api/{{SLUG_KEBAB}}/{id}` | Update an item |
| DELETE | `/api/{{SLUG_KEBAB}}/{id}` | Delete an item |

## Data Model

### {{MODEL_NAME}}

| Field | Type | Description |
|-------|------|-------------|
| uuid | string | Unique identifier |
| name | string | Item name (1-255 chars) |
| description | string | Optional description (max 2000 chars) |
| status | enum | active, inactive, archived |
| created_by | string | UUID of creator |
| created_at | datetime | Creation timestamp |
| updated_at | datetime | Last update timestamp |

## Usage

### Create Item

```bash
curl -X POST /api/{{SLUG_KEBAB}} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Item", "description": "Description"}'
```

### List Items

```bash
curl /api/{{SLUG_KEBAB}}?status=active&limit=20 \
  -H "Authorization: Bearer $TOKEN"
```

## Files

- `router.py` - API endpoints
- `schemas.py` - Pydantic models
- `service.py` - Business logic
- `__init__.py` - Module exports

## Related Files

- ODM Model: `backend/app/odm/generated/{{SLUG_SNAKE}}.py`
- Frontend Page: `frontend/src/pages/generated/{{SLUG_KEBAB}}/index.tsx`
- Frontend Types: `frontend/src/modules/{{SLUG_KEBAB}}/types.ts`
