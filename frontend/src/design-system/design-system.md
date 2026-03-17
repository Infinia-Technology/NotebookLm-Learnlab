# Design System

This document defines the design system for the application. All UI components should follow these guidelines for consistency.

## Design Tokens

Design tokens are defined in `design-tokens.css`. These are the foundational values for:
- Colors (primary, semantic, neutrals)
- Typography (fonts, sizes)
- Spacing
- Border radius
- Shadows
- Transitions

### Changing the Primary Color

The primary color is set during project initialization. To change it:

1. Open `design-tokens.css`
2. Update the `--color-app-primary-*` variables
3. Change from `var(--color-indigo-*)` to your preferred Tailwind color (e.g., `var(--color-blue-*)`)

---

## Components

### Buttons

Use the `Button` component from `components/ui/Button.tsx`.

#### Variants

| Variant | Usage |
|---------|-------|
| `primary` | Main actions (Submit, Save, Confirm) |
| `secondary` | Secondary actions |
| `outline` | Alternative actions |
| `ghost` | Subtle actions (Cancel, Back) |

#### Sizes

| Size | Usage |
|------|-------|
| `sm` | Compact areas, inline buttons |
| `md` | Default for most use cases |
| `lg` | Hero sections, prominent CTAs |

#### Example

```tsx
import { Button } from '@/components/ui/Button';

<Button variant="primary" size="md">
  Save Changes
</Button>

<Button variant="outline" size="sm">
  Cancel
</Button>

<Button variant="primary" loading>
  Saving...
</Button>
```

#### Do's and Don'ts

- DO use `primary` for the main action in a form
- DO use `ghost` for destructive actions that need confirmation
- DON'T use multiple `primary` buttons in the same view
- DON'T use raw `<button>` elements - always use the Button component

---

### Inputs

Use the `Input` component from `components/ui/Input.tsx`.

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `label` | string | Label text above the input |
| `error` | string | Error message to display |
| `helperText` | string | Helper text below the input |

#### Example

```tsx
import { Input } from '@/components/ui/Input';

<Input
  label="Email Address"
  type="email"
  placeholder="you@example.com"
  error={errors.email}
/>

<Input
  label="Password"
  type="password"
  helperText="Must be at least 8 characters"
/>
```

#### Do's and Don'ts

- DO always include a `label` for accessibility
- DO show validation errors using the `error` prop
- DON'T use raw `<input>` elements - always use the Input component
- DON'T define input styles inline

---

### Cards

Use the `Card` component from `components/ui/Card.tsx`.

#### Example

```tsx
import { Card, CardHeader } from '@/components/ui/Card';

<Card>
  <CardHeader title="Settings" subtitle="Manage your preferences" />
  <div>Card content here</div>
</Card>

<Card className="p-8">
  Custom padding
</Card>
```

#### Do's and Don'ts

- DO use Cards to group related content
- DO use `CardHeader` for consistent section titles
- DON'T nest Cards within Cards
- DON'T override card shadows with inline styles

---

## Typography

### Headings

| Element | Tailwind Class | Usage |
|---------|---------------|-------|
| `h1` | `text-3xl font-bold` | Page titles |
| `h2` | `text-2xl font-semibold` | Section titles |
| `h3` | `text-xl font-semibold` | Subsection titles |
| `h4` | `text-lg font-medium` | Card titles |

### Body Text

| Type | Tailwind Class | Usage |
|------|---------------|-------|
| Default | `text-base text-gray-900` | Body text |
| Small | `text-sm text-gray-600` | Helper text, captions |
| Muted | `text-sm text-gray-500` | Secondary information |

### Example

```tsx
<h1 className="text-3xl font-bold text-gray-900">Page Title</h1>
<p className="text-base text-gray-600 mt-2">Description text</p>
<p className="text-sm text-gray-500">Secondary info</p>
```

---

## Spacing

Use consistent spacing throughout the app:

| Token | Value | Usage |
|-------|-------|-------|
| `space-2` | 8px | Tight spacing (between related items) |
| `space-4` | 16px | Default spacing |
| `space-6` | 24px | Section spacing |
| `space-8` | 32px | Large section gaps |

### Example

```tsx
<div className="space-y-4">
  <Input label="Name" />
  <Input label="Email" />
</div>

<div className="mt-8">
  <Button>Submit</Button>
</div>
```

---

## Colors

### Primary Color

The primary color is defined in `design-tokens.css` and can be changed during initialization.

Usage:
- `bg-app-primary` - Primary background
- `text-app-primary` - Primary text
- `border-app-primary` - Primary border
- `hover:bg-app-primary-hover` - Hover state

### Semantic Colors

| Color | CSS Variable | Usage |
|-------|-------------|-------|
| Success | `--color-app-success` | Confirmations, completed states |
| Warning | `--color-app-warning` | Caution, pending states |
| Danger | `--color-app-danger` | Errors, destructive actions |
| Info | `--color-app-info` | Information, tips |

---

## Form Patterns

### Standard Form Layout

```tsx
<form onSubmit={handleSubmit} className="space-y-6">
  <Input
    label="Email"
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    error={errors.email}
  />

  <Input
    label="Password"
    type="password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    error={errors.password}
  />

  <Button type="submit" loading={isLoading}>
    Sign In
  </Button>
</form>
```

### Form with Sections

```tsx
<Card>
  <CardHeader title="Personal Information" />
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <Input label="First Name" />
      <Input label="Last Name" />
    </div>
    <Input label="Email" type="email" />
  </div>
</Card>
```

---

## Accessibility

### Requirements

1. All inputs must have labels
2. Error messages must be associated with inputs via `aria-describedby`
3. Interactive elements must have focus states
4. Color alone should not convey information

### Focus States

All interactive elements have visible focus states:
- Inputs: `focus:ring-2 focus:ring-app-primary`
- Buttons: `focus:ring-2 focus:ring-offset-2`

---

## Dark Mode

The design system supports dark mode automatically via the `.dark` class on `<html>`.

Components adapt their colors using CSS variables defined in `design-tokens.css`.

---

## Summary

| Component | Import From |
|-----------|-------------|
| Button | `@/components/ui/Button` |
| Input | `@/components/ui/Input` |
| Card | `@/components/ui/Card` |

**Rules:**
1. Never use raw HTML `<input>` or `<button>` elements
2. Always import from `components/ui/`
3. Use Tailwind classes from design tokens
4. Never define colors inline
