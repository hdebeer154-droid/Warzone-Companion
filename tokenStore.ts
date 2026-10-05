import * as SecureStore from 'expo-secure-store';

/**
 * Secure token storage.
 *
 * Access + refresh tokens are kept in the platform secure store (Keychain /
 * Keystore). We never persist any third-party game credentials — only our own
 * session tokens.
 */
const ACCESS_KEY = 'wz.accessToken';
const REFRESH_KEY = 'wz.refreshToken';

let memoryAccess: string | null = null;
let memoryRefresh: string | null = null;

export const tokenStore = {
  async load(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
    if (memoryAccess || memoryRefresh) {
      return { accessToken: memoryAccess, refreshToken: memoryRefresh };
    }
    try {
      const [accessToken, refreshToken] = await Promise.all([
        SecureStore.getItemAsync(ACCESS_KEY),
        SecureStore.getItemAsync(REFRESH_KEY),
      ]);
      memoryAccess = accessToken;
      memoryRefresh = refreshToken;
      return { accessToken, refreshToken };
    } catch {
      return { accessToken: null, refreshToken: null };
    }
  },

  async save(accessToken: string, refreshToken: string): Promise<void> {
    memoryAccess = accessToken;
    memoryRefresh = refreshToken;
    try {
      await Promise.all([
        SecureStore.setItemAsync(ACCESS_KEY, accessToken),
        SecureStore.setItemAsync(REFRESH_KEY, refreshToken),
      ]);
    } catch {
      // Non-fatal: session stays in memory for this run.
    }
  },

  async clear(): Promise<void> {
    memoryAccess = null;
    memoryRefresh = null;
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(ACCESS_KEY),
        SecureStore.deleteItemAsync(REFRESH_KEY),
      ]);
    } catch {
      // ignore
    }
  },

  getAccessTokenSync(): string | null {
    return memoryAccess;
  },
};
