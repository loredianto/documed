import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { AUTH_EXPIRED_EVENT, clearAccessToken, getAccessToken, isTokenUsable } from "../api/http";
import { login as requestLogin } from "../api/auth";

interface AuthContextValue {
  authenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(() => isTokenUsable(getAccessToken()));

  useEffect(() => {
    const expireSession = () => setAuthenticated(false);
    window.addEventListener(AUTH_EXPIRED_EVENT, expireSession);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, expireSession);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      authenticated,
      login: async (username, password) => {
        await requestLogin(username, password);
        setAuthenticated(true);
      },
      logout: () => {
        clearAccessToken();
        setAuthenticated(false);
      },
    }),
    [authenticated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth deve essere usato dentro AuthProvider");
  return value;
}
