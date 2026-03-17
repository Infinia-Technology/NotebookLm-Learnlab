# GitHub Copilot Instructions

## Project: SAIL Starter Kit

Fullstack platform with FastAPI backend and React frontend.

## Tech Stack

- **Backend**: FastAPI, Pydantic v2, MongoDB (Motor async), bcrypt, python-jose
- **Frontend**: React 19, TypeScript, Vite, TailwindCSS v4, Zustand, React Query
- **Infrastructure**: Docker Compose, Nginx, Redis

## Code Style

### Python (Backend)
- Use async/await for all database operations
- Type hints for all function parameters and returns
- Pydantic schemas for request/response validation
- Dependency injection via `Depends()`
- Error handling with appropriate HTTP status codes

```python
# Example endpoint pattern
@router.post("/items", response_model=ItemResponse)
async def create_item(
    item: ItemCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> ItemResponse:
    # Implementation
```

### TypeScript (Frontend)
- Strict mode enabled
- Interfaces for all props and API responses
- Functional components with hooks
- TailwindCSS for styling (no inline styles)

```typescript
// Example component pattern
interface Props {
  title: string;
  onSubmit: (data: FormData) => void;
}

export function MyComponent({ title, onSubmit }: Props) {
  // Implementation
}
```

## Design System

Always use components from `frontend/src/components/ui/`:
- `Button` - Never raw `<button>`
- `Input` - Never raw `<input>`
- `Select` - Never raw `<select>`
- `Card` - Content containers
- `Modal` - Dialogs

Use CSS variables for colors: `var(--btn-primary-bg)`, `var(--color-app-primary-500)`

## File Locations

- Backend modules: `backend/app/modules/<name>/`
- Frontend pages: `frontend/src/pages/`
- UI components: `frontend/src/components/ui/`
- Design tokens: `frontend/src/design-system/design-tokens.css`
- Config: `system.config.json`

## Restrictions

- Do NOT introduce new frameworks/libraries
- Do NOT bypass authentication/RBAC
- Do NOT modify docker-compose.yml without approval
- Do NOT write inline CSS
- Do NOT use raw HTML form elements
- Do NOT hardcode color values

## Common Patterns

### API Client
```typescript
import { api } from '@/lib/api';
const data = await api.get<ResponseType>('/endpoint');
```

### Protected Route
```tsx
<Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
```

### Form Validation
Frontend validation in `lib/validation.ts` mirrors backend Pydantic schemas.
