"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { login as apiLogin, LoginData, LoginUser } from "@/lib/api/loginApi";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from "@/lib/auth/tokens";
import { api } from "@/lib/api/index";
import { ENDPOINTS } from "@/lib/api/endpoints";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser extends LoginUser {}

interface AuthContextValue {
  /** The currently authenticated user, or null if not logged in. */
  user: AuthUser | null;
  /** True while the context is verifying the stored token on mount. */
  isLoading: boolean;
  /** True when a login / logout action is in-flight. */
  isAuthenticating: boolean;
  /** Whether a valid user session exists. */
  isAuthenticated: boolean;
  /** Sign in with email/username + password. Throws on failure. */
  login: (data: LoginData) => Promise<void>;
  /** Destroy the current session and redirect to /login. */
  logout: () => Promise<void>;
  /** Manually update the user object (e.g. after a profile edit). */
  setUser: (user: AuthUser | null) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

const USER_KEY = "auth_user";

function persistUser(user: AuthUser | null) {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

function loadPersistedUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [user, _setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true); // resolves after mount check
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  /** Update user state and keep localStorage in sync. */
  const setUser = useCallback((u: AuthUser | null) => {
    _setUser(u);
    persistUser(u);
  }, []);

  // On mount: restore user from localStorage and verify token is still valid.
  useEffect(() => {
    const restore = async () => {
      const token = getAccessToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Optimistically restore from cache so the UI is instant.
      const cached = loadPersistedUser();
      if (cached) _setUser(cached);

      // Then verify the token is still accepted by the server.
      try {
        const fresh = await api<AuthUser>("/auth/me/", { token });
        setUser(fresh);
      } catch {
        // Token expired / invalid — clear everything.
        clearTokens();
        persistUser(null);
        _setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    restore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (data: LoginData) => {
      setIsAuthenticating(true);
      try {
        const response = await apiLogin(data); // saves tokens internally
        setUser(response.user);
      } finally {
        setIsAuthenticating(false);
      }
    },
    [setUser]
  );

  const logout = useCallback(async () => {
    setIsAuthenticating(true);
    try {
      const token = getAccessToken();
      const refresh = getRefreshToken();
      if (token && refresh) {
        // Best-effort server logout — don't let failures block the client logout.
        await api(ENDPOINTS.AUTH.LOGOUT, {
          method: "POST",
          token,
          body: JSON.stringify({ refresh }),
        }).catch(() => {});
      }
    } finally {
      clearTokens();
      setUser(null);
      setIsAuthenticating(false);
      router.push("/login");
    }
  }, [setUser, router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticating,
      isAuthenticated: !!user,
      login,
      logout,
      setUser,
    }),
    [user, isLoading, isAuthenticating, login, logout, setUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Access the auth context from any client component.
 *
 * @example
 * const { user, isAuthenticated, login, logout } = useAuth();
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
