import Constants from 'expo-constants';

import { getSessionToken } from './session';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

function resolveBaseUrl(): string {
  const extra =
    ((Constants.expoConfig ?? (Constants as any).manifest)?.extra as { apiBaseUrl?: string } | undefined) ?? {};
  const env = process.env.EXPO_PUBLIC_API_BASE_URL;
  return extra.apiBaseUrl || env || 'http://localhost:3000';
}

async function parseJsonSafe(res: Response) {
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json().catch(() => undefined);
  }
  return undefined;
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = resolveBaseUrl().replace(/\/$/, '');
  const url = path.startsWith('http') ? path : `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  const sessionToken = await getSessionToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (sessionToken && !('Cookie' in headers)) {
    headers.Cookie = `session_token=${sessionToken}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const data = await parseJsonSafe(res);
    const message = (data && (data.error || data.message)) || `HTTP ${res.status}`;
    throw new ApiError(String(message), res.status, data);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const data = await parseJsonSafe(res);
  return data as T;
}

export async function mutate<T>(path: string, method: HttpMethod, body?: unknown, init?: RequestInit): Promise<T> {
  return request<T>(path, {
    ...init,
    method,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}
