# AI Development Guidelines

## Project Architecture

This is a fullstack platform template for EleVatria with the following stack:

### Backend (FastAPI + Python)
- **Framework**: FastAPI with Pydantic v2
- **Database**: MongoDB with Motor async driver
- **Authentication**: JWT with bcrypt password hashing
- **Structure**: EleVatria-driven modular architecture

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
- Access frontend at http://localhost:3100
- MongoDB is exposed at localhost:27017
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
5. Create `system.config.json`

## System Architecture Rules

### Configuration
- App configuration is read from `system.config.json`.
- Frontend uses `useSystemConfig()` hook to access configuration.
- Configuration includes: app name, slug, description, type, theme color, and layout settings.

### Layout System
- `AppShell` is the main layout wrapper component.
- `Sidebar` provides collapsible navigation (state persisted in localStorage).
- `HeaderBar` provides top navigation with breadcrumbs and user menu.
- All protected routes should use AppShell as the layout wrapper.

### UI Components
- All UI components must come from `frontend/src/components/ui/`.
- Never use raw `<input>`, `<button>`, `<select>`, or `<textarea>` elements.
- Use the Button component for all buttons.
- Use the Input component for all text inputs.
- Use the Select component for all dropdowns.
- Use the Card component for content containers.

### Validation
- Frontend validation is in `frontend/src/lib/validation.ts`.
- Backend validation uses Pydantic schemas in `backend/app/modules/auth/schemas.py`.
- Keep frontend and backend validation rules in sync.
- Frontend validation functions mirror Pydantic schemas:
  - `validateLoginForm` → `LoginRequest`
  - `validateSignupForm` → `SignupRequest`
  - `validateResetPasswordForm` → `ResetPasswordRequest`

### Design Tokens
- All colors come from `frontend/src/design-system/design-tokens.css`.
- Use CSS variables like `var(--btn-primary-bg)` for colors.
- Never hardcode color values in components.
- Primary color scale: `--color-app-primary-50` to `--color-app-primary-900`.

### Verification
- Run `./verify-project.sh` to validate project configuration.
- The script checks: config files, Docker setup, design system compliance, and YAML validity.
- Fix all warnings and errors before deployment.

## Safe Code Generation

### Protected Files (Do Not Modify Without Review)
- `backend/app/core/*` - Core configuration and database setup
- `backend/app/auth/*` - Authentication utilities
- `frontend/src/components/ui/*` - Design system components
- `frontend/src/design-system/*` - Design tokens
- `system.config.json` - System configuration
- `.cursorrules` - AI coding rules
- `ai-guidelines.md` - Development guidelines

### Restricted Modifications
- Do not change the tech stack (FastAPI, React, MongoDB, etc.)
- Do not modify docker-compose.yml without explicit approval
- Do not bypass authentication or RBAC checks
- Do not create new databases
- Do not introduce new frameworks or libraries

### Code Generation Best Practices
1. Always use design system components for UI
2. Follow existing naming conventions
3. Validate inputs on both frontend and backend
4. Use TypeScript strict mode
5. Handle errors appropriately
6. Write async/await for all database operations
7. Use dependency injection via FastAPI's Depends()

## App Generation

The platform includes an app generation system that scaffolds new application modules from templates.

### Using the Generator

Run the interactive generator script:

```bash
./generate-app.sh
```

The script will prompt for:
- **App Name**: Human-readable name (e.g., "Invoice Manager")
- **App Slug**: URL-friendly identifier (e.g., "invoice-manager")
- **Description**: One-line description of the app
- **Template Type**: Base template to use

### Available Template Types

| Template | Description | Use Case |
|----------|-------------|----------|
| `saas-dashboard` | Multi-tenant SaaS with dashboard | Subscription apps, admin panels |
| `marketplace` | E-commerce with listings | Marketplaces, product catalogs |
| `ocr-engine` | Document processing | Invoice scanning, data extraction |
| `analytics-platform` | Charts and reports | Business intelligence, metrics |
| `legal-ai` | Contract analysis | Legal tech, document review |
| `fraud-detector` | Risk scoring and alerts | Compliance, fraud prevention |
| `automation-suite` | Workflow automation | Process automation, integrations |
| `ai-assistant` | Conversational AI | Chatbots, AI agents |

### Generated Files Structure

For an app named "Invoice Manager" (slug: `invoice-manager`):

```
backend/app/modules/invoice_manager/
├── __init__.py       # Module exports
├── router.py         # API endpoints
├── schemas.py        # Pydantic models
├── service.py        # Business logic
└── README.md         # Module documentation

backend/app/odm/generated/invoice_manager.py  # MongoDB model

frontend/src/pages/generated/invoice-manager/
└── index.tsx         # Main app page

frontend/src/pages/landing/invoice-manager.tsx  # Landing page

frontend/src/modules/invoice-manager/
├── types.ts          # TypeScript interfaces
└── schema.ts         # Zod validation schemas
```

### Post-Generation Steps

After running the generator, complete these manual integration steps:

1. **Export the router** in `backend/app/modules/__init__.py`:
   ```python
   from app.modules.invoice_manager.router import router as invoice_manager_router
   __all__ = [..., "invoice_manager_router"]
   ```

2. **Register the router** in `backend/app/api/api.py`:
   ```python
   from app.modules import invoice_manager_router

   api_router.include_router(
       invoice_manager_router,
       prefix="/invoice-manager",
       tags=["invoice-manager"],
       dependencies=auth_required
   )
   ```

3. **Add frontend routes** in `frontend/src/App.tsx`:
   ```tsx
   import InvoiceManagerPage from './pages/generated/invoice-manager';
   import InvoiceManagerLandingPage from './pages/landing/invoice-manager';

   // In routes:
   <Route path="/invoice-manager" element={<InvoiceManagerLandingPage />} />
   <Route path="/dashboard/invoice-manager" element={<AuthGuard><InvoiceManagerPage /></AuthGuard>} />
   ```

4. **(Optional) Install Zod** for frontend validation:
   ```bash
   cd frontend && npm install zod @hookform/resolvers
   ```

### Template Variables

Templates use these placeholders:

| Variable | Example | Description |
|----------|---------|-------------|
| `{{APP_NAME}}` | Invoice Manager | Human-readable name |
| `{{MODEL_NAME}}` | InvoiceManager | PascalCase for classes |
| `{{SLUG}}` | invoice-manager | URL-friendly slug |
| `{{SLUG_SNAKE}}` | invoice_manager | Python naming |
| `{{SLUG_KEBAB}}` | invoice-manager | URL paths |
| `{{DESCRIPTION}}` | Manage invoices | App description |
| `{{TEMPLATE_TYPE}}` | saas-dashboard | Template used |
| `{{GENERATED_AT}}` | 2024-01-15T10:30:00Z | Generation timestamp |

### Registry Files

- `templates/registry.json` - Template definitions (8 types)
- `templates/generated-apps.json` - Runtime registry of generated apps
- `frontend/public/generated-apps.json` - Copy for frontend access

### Dynamic Navigation

Generated apps automatically appear in the sidebar navigation. The `useGeneratedApps()` hook fetches the app list from `generated-apps.json`.

### Verification

Run `./verify-project.sh` to check:
- Template registry exists
- Generated apps have complete backend modules
- Generated apps have frontend pages
- Routers are exported and registered
