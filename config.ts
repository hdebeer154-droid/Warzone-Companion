import Constants from 'expo-constants';

/**
 * Resolve the backend base URL.
 *
 * Priority: EXPO_PUBLIC_API_BASE_URL (env) → app.json `extra.apiBaseUrl`.
 * The mobile client ONLY ever talks to this backend.
 */
function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (fromEnv && fromEnv.length > 0) return stripTrailingSlash(fromEnv);
  const fromExtra = (Constants.expoConfig?.extra as Record<string, unknown> | undefined)
    ?.apiBaseUrl;
  if (typeof fromExtra === 'string' && fromExtra.length > 0) {
    return stripTrailingSlash(fromExtra);
  }
  return 'http://127.0.0.1:4100/api/v1';
}

function stripTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

export const API_BASE_URL = resolveBaseUrl();

/** How long to wait before giving up on a request (ms). */
export const REQUEST_TIMEOUT = 20000;
