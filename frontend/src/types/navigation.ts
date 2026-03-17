/**
 * Navigation Types
 *
 * Type definitions for the navigation system including
 * static and dynamically generated app navigation items.
 */

import type { LucideIcon } from 'lucide-react';

/**
 * A single navigation item
 */
export interface NavItem {
  /** Display name */
  name: string;
  /** Route path */
  href: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Optional badge text (e.g., count) */
  badge?: string | number;
  /** Whether this is an external link */
  external?: boolean;
}

/**
 * A group of navigation items
 */
export interface NavGroup {
  /** Group name displayed as header */
  name: string;
  /** Unique identifier for localStorage persistence */
  id: string;
  /** Navigation items in this group */
  items: NavItem[];
  /** Whether group starts collapsed */
  defaultCollapsed?: boolean;
}

/**
 * Generated app entry from generated-apps.json
 */
export interface GeneratedApp {
  /** Human-readable name */
  name: string;
  /** URL-friendly slug */
  slug: string;
  /** App description */
  description: string;
  /** Template type used */
  template: string;
  /** Lucide icon name */
  icon: string;
  /** Theme color */
  color: string;
  /** ISO timestamp when generated */
  generatedAt: string;
  /** File paths for the generated app */
  paths: {
    backend: string;
    odm: string;
    frontendPage: string;
    frontendLanding: string;
    frontendModule: string;
  };
}

/**
 * Generated apps registry structure
 */
export interface GeneratedAppsRegistry {
  version: string;
  apps: GeneratedApp[];
}
