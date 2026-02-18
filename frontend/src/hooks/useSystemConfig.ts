import { useState, useEffect } from 'react';

export interface SystemConfig {
  app: {
    name: string;
    slug: string;
    description: string;
    type: string;
  };
  theme: {
    primaryColor: string;
  };
  layout: {
    sidebarCollapsedByDefault: boolean;
  };
}

const defaultConfig: SystemConfig = {
  app: {
    name: 'EleVatria',
    slug: 'elevatria',
    description: 'AI-Enabled App Generation Platform',
    type: 'saas-dashboard',
  },
  theme: {
    primaryColor: 'sky',
  },
  layout: {
    sidebarCollapsedByDefault: false,
  },
};

let cachedConfig: SystemConfig | null = null;

/**
 * Hook to load and access system configuration.
 *
 * The configuration is loaded from /system.config.json if it exists,
 * otherwise falls back to default values.
 *
 * This hook is designed to work with the init-project.sh script
 * which generates the system.config.json file during initialization.
 */
export function useSystemConfig(): { config: SystemConfig; loading: boolean } {
  const [config, setConfig] = useState<SystemConfig>(cachedConfig || defaultConfig);
  const [loading, setLoading] = useState(!cachedConfig);

  useEffect(() => {
    if (cachedConfig) {
      return;
    }

    async function loadConfig() {
      try {
        const response = await fetch('/system.config.json');
        if (response.ok) {
          const data = await response.json();
          const loadedConfig: SystemConfig = {
            app: { ...defaultConfig.app, ...data.app },
            theme: { ...defaultConfig.theme, ...data.theme },
            layout: { ...defaultConfig.layout, ...data.layout },
          };
          cachedConfig = loadedConfig;
          setConfig(loadedConfig);
        }
      } catch {
        // Config file not found, use defaults
        cachedConfig = defaultConfig;
      } finally {
        setLoading(false);
      }
    }

    loadConfig();
  }, []);

  return { config, loading };
}

/**
 * Get the app name synchronously.
 * Returns the default name if config hasn't loaded yet.
 */
export function getAppName(): string {
  return cachedConfig?.app.name || defaultConfig.app.name;
}

/**
 * Get the app description synchronously.
 */
export function getAppDescription(): string {
  return cachedConfig?.app.description || defaultConfig.app.description;
}

/**
 * Get sidebar collapsed default state synchronously.
 */
export function getSidebarCollapsedDefault(): boolean {
  return cachedConfig?.layout.sidebarCollapsedByDefault ?? defaultConfig.layout.sidebarCollapsedByDefault;
}
