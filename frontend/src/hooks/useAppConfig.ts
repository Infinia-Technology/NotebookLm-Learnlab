import { useState, useEffect } from 'react';

export interface AppConfig {
  app: {
    name: string;
    slug: string;
    description: string;
    type: string;
  };
  theme: {
    primaryColor: string;
  };
}

const defaultConfig: AppConfig = {
  app: {
    name: 'EleVatria',
    slug: 'elevatria',
    description: 'Elevate Your Team. Accelerate Your Growth.',
    type: 'saas-dashboard',
  },
  theme: {
    primaryColor: 'sky',
  },
};

let cachedConfig: AppConfig | null = null;

/**
 * Hook to load and access app configuration.
 *
 * The configuration is loaded from /app.config.json if it exists,
 * otherwise falls back to default values.
 *
 * This hook is designed to work with the init-project.py script
 * which generates the app.config.json file during initialization.
 */
export function useAppConfig(): { config: AppConfig; loading: boolean } {
  const [config, setConfig] = useState<AppConfig>(cachedConfig || defaultConfig);
  const [loading, setLoading] = useState(!cachedConfig);

  useEffect(() => {
    if (cachedConfig) {
      return;
    }

    async function loadConfig() {
      try {
        const response = await fetch('/app.config.json');
        if (response.ok) {
          const data = await response.json();
          const loadedConfig: AppConfig = { ...defaultConfig, ...data };
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
