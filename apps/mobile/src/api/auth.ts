import Constants from 'expo-constants';

import { request } from './client';
import { setSessionToken, getSessionToken } from './session';
import { extractCookieValue } from '../utils/cookies';

type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  comuna?: string | null;
  position?: string | null;
  role?: string | null;
};

type AuthResponse = {
  ok: boolean;
  user?: AuthUser | null;
  error?: string;
};

function resolveBaseUrl(): string {
  const extra =
    ((Constants.expoConfig ?? (Constants as any).manifest)?.extra as { apiBaseUrl?: string } | undefined) ?? {};
  const env = process.env.EXPO_PUBLIC_API_BASE_URL;
  return extra.apiBaseUrl || env || 'http://localhost:3000';
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const baseUrl = resolveBaseUrl().replace(/\/$/, '');
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = (await res.json().catch(() => ({}))) as AuthResponse;
  if (!res.ok || !data.ok) {
    throw new Error(data.error || 'Credenciales inválidas');
  }

  const cookieHeader = res.headers.get('set-cookie');
  const token = extractCookieValue(cookieHeader, 'session_token');
  if (token) {
    await setSessionToken(token);
  }
  return data;
}

export async function fetchSession(): Promise<AuthUser | null> {
  try {
    const data = await request<{ user: AuthUser | null }>('/api/auth/session');
    return data.user ?? null;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  const baseUrl = resolveBaseUrl().replace(/\/$/, '');
  const sessionToken = await getSessionToken();
  await fetch(`${baseUrl}/api/auth/signout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(sessionToken ? { Cookie: `session_token=${sessionToken}` } : {}),
    },
    body: JSON.stringify({}),
  }).catch(() => {});
  await setSessionToken(null);
}

export type { AuthUser };
