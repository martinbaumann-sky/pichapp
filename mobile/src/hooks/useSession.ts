import { useCallback, useEffect, useState } from 'react';

import { AuthUser, fetchSession, login as loginRequest, logout as logoutRequest } from '../api/auth';

export function useSession() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSession()
      .then((session) => {
        setUser(session);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const { user: loggedUser } = await loginRequest(email, password);
      setUser(loggedUser ?? null);
      return loggedUser ?? null;
    } catch (err: any) {
      const message = err?.message ?? 'No fue posible iniciar sesión';
      setError(String(message));
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    setUser(null);
  }, []);

  return { user, loading, error, login, logout };
}
