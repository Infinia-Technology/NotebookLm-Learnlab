# SAIL Starter Kit - Claude Code Instructions

## Project Overview

AI-Enabled Fullstack Starter Kit with app generation, authentication, and multi-tenant support.

**Stack:**
- Backend: FastAPI + Pydantic v2 + MongoDB (Motor async)
- Frontend: React 19 + TypeScript + Vite + TailwindCSS v4 + Zustand + React Query
- Infrastructure: Docker Compose + Nginx + Redis

## Critical Rules

### DO NOT
- Introduce new frameworks or libraries without explicit approval
- Modify `docker-compose.yml` without asking
- Bypass authentication or RBAC checks
- Create new databases
- Write inline CSS - use Tailwind utility classes
- Use raw HTML elements (`<input>`, `<button>`, `<select>`) - use design system components
- Hardcode colors - use CSS variables like `var(--btn-primary-bg)`
- Manually create files in `backend/app/modules/` or `frontend/src/pages/generated/` - use `./generate-app.sh`

### ALWAYS
- Use design system components from `frontend/src/components/ui/`
- Follow existing naming conventions
- Validate inputs on both frontend and backend
- Use async/await for database operations
- Use dependency injection via FastAPI's `Depends()`
- Run `./verify-project.sh` before deployment

## Directory Structure

```
backend/app/
├── api/           # Router registration
├── auth/          # JWT utilities
├── core/          # Config, database
├── modules/       # Feature modules (auth, admin, account, domains)
├── odm/           # MongoDB document models
└── services/      # Shared logic (email, rbac)

frontend/src/
├── components/ui/ # Design system components
├── design-system/ # Design tokens CSS
├── hooks/         # Custom hooks
├── pages/         # Route pages
└── stores/        # Zustand stores
```

## Key Files

| File | Purpose |
|------|---------|
| `system.config.json` | App name, theme, layout config |
| `.env` | Environment variables (secrets) |
| `frontend/src/design-system/design-tokens.css` | Color tokens |
| `frontend/src/components/ui/` | Button, Input, Card, etc. |
| `templates/registry.json` | App generation templates |

## Common Tasks

### Add Backend API
1. Create `backend/app/modules/<name>/` with router.py, schemas.py, service.py
2. Export router in `modules/__init__.py`
3. Register in `api/api.py`

### Add Frontend Page
1. Create `frontend/src/pages/<Name>.tsx`
2. Add route in `App.tsx`
3. Update `Sidebar.tsx` if navigation needed

### Generate New App Module
```bash
./generate-app.sh
```
Then complete manual integration steps (export router, register, add routes).

## Email Configuration

Supports multiple providers via `EMAIL_PROVIDER` env var:
- `console` - Development (logs only)
- `smtp` - Any SMTP server
- `resend` - Resend API

## Verification

```bash
./verify-project.sh  # Check project compliance
```

## Protected Files (Review Before Modifying)

- `backend/app/core/*` - Core config
- `backend/app/auth/*` - Auth utilities
- `frontend/src/components/ui/*` - Design system
- `system.config.json` - App configuration
