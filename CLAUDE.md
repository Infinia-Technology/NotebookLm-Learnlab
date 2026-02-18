# EleVatria - Claude Code Instructions

## Project Overview

AI-Enabled Fullstack Starter Kit with app generation, authentication, and multi-tenant support.

**Stack:**
- Backend: FastAPI + Pydantic v2 + MongoDB (Motor async)
- Frontend: React 19 + TypeScript + Vite + TailwindCSS v4 + Zustand + React Query
- Infrastructure: Docker Compose + Nginx + Redis

## First Time Setup (IMPORTANT)

**If this is a fresh clone or the user asks to "start the project":**

1. Ask the user for their app preferences:
   - App name (required)
   - Primary color (default: sky)
   - App type (default: saas-dashboard)

2. Run init with their values:
```bash
./init-project.sh --name "User's App Name" --color indigo --type saas-dashboard
docker compose up --build
```

Available options:
- `--name NAME` - App name (required for non-interactive)
- `--slug SLUG` - URL-friendly slug (auto-generated from name if not provided)
- `--color COLOR` - Tailwind color name or hex (default: sky)
- `--type TYPE` - saas-dashboard, marketplace, internal-tool, ai-chat-app, other
- `--desc DESC` - App description
- `--defaults` - Skip prompts, use all defaults

The init script will:
1. Ask for app name, slug, primary color, description
2. Generate `system.config.json` with your settings
3. Create `.env` from template with secure defaults
4. Update Docker service names

**DO NOT** just copy `.env.example` and run `docker compose up` - always use `./init-project.sh` first.

After init, access the app at:
- Frontend: http://localhost:3100
- API Docs: http://localhost:3100/api/docs

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
- **Build and test via Docker**: `docker compose up --build` (NOT `npm run build`)

## Building & Testing (IMPORTANT)

**ALWAYS use Docker to build and run the project:**
```bash
docker compose up --build      # Build and start
docker compose up --build -d   # Build and start in background
docker compose logs -f         # View logs
```

**NEVER just run `npm run build` or `npm run dev`** - always verify changes work in Docker.

After making code changes, rebuild with Docker to verify everything works.

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
