import { useEffect } from 'react';
import { useSystemConfig } from '../hooks/useSystemConfig';

/**
 * Component that sets the document title based on system config.
 * Must be rendered inside the app to dynamically update the title.
 */
export function DocumentTitle() {
  const { config } = useSystemConfig();

  useEffect(() => {
    if (config.app.name) {
      document.title = config.app.name;
    }
  }, [config.app.name]);

  return null;
}
