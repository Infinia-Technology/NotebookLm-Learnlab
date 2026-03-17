/**
 * Core API client configuration.
 *
 * This is the centralized axios instance used throughout the application.
 */

import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Re-export the default api instance for backward compatibility
export default apiClient;
