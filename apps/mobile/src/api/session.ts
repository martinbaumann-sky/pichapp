import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'pichapp_session_token';
let inMemoryToken: string | null = null;

export async function getSessionToken(): Promise<string | null> {
  if (inMemoryToken !== null) {
    return inMemoryToken;
  }
  try {
    const stored = await SecureStore.getItemAsync(SESSION_KEY);
    inMemoryToken = stored ?? null;
    return inMemoryToken;
  } catch {
    return null;
  }
}

export async function setSessionToken(token: string | null): Promise<void> {
  inMemoryToken = token;
  try {
    if (token) {
      await SecureStore.setItemAsync(SESSION_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(SESSION_KEY);
    }
  } catch {
    // ignore secure store failures in dev
  }
}
