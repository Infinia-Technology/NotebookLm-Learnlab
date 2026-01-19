# AI Development Guidelines

## Project Architecture

This is a fullstack platform template with the following stack:

### Backend (FastAPI + Python)
- **Framework**: FastAPI with Pydantic v2
- **Database**: MongoDB with Motor async driver
- **Authentication**: JWT with bcrypt password hashing
- **Structure**: Domain-driven modular architecture

### Frontend (React + TypeScript)
- **Framework**: React 19 with Vite
- **Styling**: TailwindCSS v4
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Routing**: React Router v6

## Directory Structure

```
backend/
├── app/
│   ├── api/           # Router registration and dependencies
│   ├── auth/          # JWT and password utilities
│   ├── core/          # Config and database setup
│   ├── db/            # Database connection and seeding
│   ├── modules/       # Feature modules (router, service, schemas)
│   ├── odm/           # MongoDB document models
│   └── services/      # Shared business logic

frontend/
├── src/
│   ├── components/    # Reusable UI components
│   ├── contexts/      # React contexts (Auth, Theme)
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utilities and API client
│   ├── pages/         # Route page components
│   ├── stores/        # Zustand stores
│   └── types/         # TypeScript interfaces
```

## Development Guidelines

### Adding a New Backend Module

1. Create a new directory in `backend/app/modules/<module_name>/`
2. Add the following files:
   - `__init__.py` - Module exports
   - `router.py` - FastAPI router with endpoints
   - `schemas.py` - Pydantic request/response models
   - `service.py` - Business logic functions
3. Export the router in `backend/app/modules/__init__.py`
4. Register the router in `backend/app/api/api.py`

### Adding a New Frontend Page

1. Create the page component in `frontend/src/pages/<PageName>.tsx`
2. Add the route in `frontend/src/App.tsx`
3. If protected, wrap with `AuthGuard` component
4. Update navigation in `frontend/src/components/layout/Sidebar.tsx` if needed

### Adding a New UI Component

1. Create the component in `frontend/src/components/ui/<ComponentName>.tsx`
2. Export from the component file
3. Use Tailwind utility classes for styling
4. Follow existing component patterns for consistency

## Code Standards

### Backend
- Use async/await for all database operations
- Validate all inputs with Pydantic schemas
- Use dependency injection via FastAPI's `Depends()`
- Handle errors with appropriate HTTP status codes
- Use type hints for all function parameters and returns

### Frontend
- Use TypeScript strict mode
- Define interfaces for all props and API responses
- Use functional components with hooks
- Prefer composition over inheritance
- Keep components small and focused

### Security
- Never bypass authentication checks
- Always validate user permissions via RBAC
- Sanitize all user inputs
- Never log sensitive data (passwords, tokens)
- Use parameterized queries for database operations

## Docker Development

- Run `docker compose up -d` to start all services
- Run `docker compose up --build` to rebuild after code changes
- Access frontend at http://localhost:3700
- MongoDB is exposed at localhost:27100
- Use `docker compose logs -f <service>` to view logs

## Environment Variables

Required variables in `.env`:
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `ADMIN_EMAIL` - Initial admin user email
- `ADMIN_PASSWORD` - Initial admin user password

See `.env.example` for all available options.

## Design System Rules

### Component Usage
- All interactive UI elements must come from `components/ui/`
- Use `Button` component for all buttons - never raw `<button>`
- Use `Input` component for all text inputs - never raw `<input>`
- Use `Card` component for content containers
- Tailwind tokens come from `design-system/design-tokens.css`
- Never define colors inline - use CSS variables like `var(--btn-primary-bg)`

### Design Tokens
The design system uses CSS custom properties defined in `frontend/src/design-system/design-tokens.css`:

- `--btn-primary-bg` - Primary button background
- `--btn-primary-hover` - Primary button hover state
- `--color-app-primary-*` - Primary color scale (50-900)
- `--color-app-success/warning/danger` - Semantic colors

### File Locations
- Design tokens: `frontend/src/design-system/design-tokens.css`
- Design documentation: `frontend/src/design-system/design-system.md`
- UI components: `frontend/src/components/ui/`

## App Personalization

### Configuration Files
- `app.config.json` is the source of truth for:
  - App name
  - App slug (used in Docker service names)
  - App description
  - Theme color
  - App type (saas-dashboard, marketplace, etc.)

### Accessing Configuration
- Backend: Read `app.config.json` from project root
- Frontend: Use `useAppConfig()` hook from `hooks/useAppConfig.ts`
- The config is served from `/app.config.json` (in `public/`)

### Docker Service Names
After running `init-project.py`, Docker services are named:
- `<slug>-backend`
- `<slug>-frontend`
- `<slug>-mongo`
- `<slug>-redis`

### Initialization
Run `./init-project.sh` to:
1. Set app name, slug, and description
2. Choose primary color
3. Generate `.env` with secure secrets
4. Update Docker service names
5. Create `app.config.json`
