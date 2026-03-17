/**
 * useGeneratedApps Hook
 *
 * Fetches the list of dynamically generated apps from the registry.
 * Used by the navigation system to display generated app links.
 */

import { useQuery } from '@tanstack/react-query';
import type { GeneratedAppsRegistry, GeneratedApp } from '../types/navigation';

/**
 * Fetch generated apps from the public registry file
 */
async function fetchGeneratedApps(): Promise<GeneratedApp[]> {
  try {
    const response = await fetch('/generated-apps.json');
    if (!response.ok) {
      // Return empty array if file doesn't exist yet
      if (response.status === 404) {
        return [];
      }
      throw new Error('Failed to fetch generated apps');
    }
    const data: GeneratedAppsRegistry = await response.json();
    return data.apps || [];
  } catch (error) {
    // Return empty array on any error (e.g., file not found)
    console.warn('Could not load generated apps:', error);
    return [];
  }
}

/**
 * Hook to get the list of generated apps
 *
 * @returns Query result with generated apps array
 *
 * @example
 * ```tsx
 * function Navigation() {
 *   const { data: apps, isLoading } = useGeneratedApps();
 *
 *   if (isLoading) return <Spinner />;
 *
 *   return (
 *     <nav>
 *       {apps?.map(app => (
 *         <Link key={app.slug} to={`/dashboard/${app.slug}`}>
 *           {app.name}
 *         </Link>
 *       ))}
 *     </nav>
 *   );
 * }
 * ```
 */
export function useGeneratedApps() {
  return useQuery({
    queryKey: ['generated-apps'],
    queryFn: fetchGeneratedApps,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
    retry: false, // Don't retry on failure (file might not exist)
    refetchOnWindowFocus: false,
  });
}

/**
 * Get the count of generated apps
 */
export function useGeneratedAppsCount() {
  const { data: apps } = useGeneratedApps();
  return apps?.length || 0;
}
