"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getStoredAdminSession,
  storageKey,
  storeAdminSession,
} from "./helpers";

/**
 * Admin token lifecycle: restore from localStorage, expire on a timer, and
 * expose an authenticated `adminFetch` that unwraps the `{ error }` envelope
 * every admin route returns.
 *
 * `onReset` lets the dashboard clear its own data whenever the session ends,
 * so this hook never needs to know what else is on screen.
 */
export function useAdminSession({
  onReset,
  onMessage,
}: {
  onReset: () => void;
  onMessage: (message: string) => void;
}) {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      "x-admin-token": token,
    }),
    [token]
  );

  const clearAdminSession = useCallback(() => {
    window.localStorage.removeItem(storageKey);
    setToken("");
    onReset();
  }, [onReset]);

  const expireAdminSession = useCallback(() => {
    clearAdminSession();
    onMessage("Admin session expired. Please unlock again.");
  }, [clearAdminSession, onMessage]);

  const isAdminSessionExpired = useCallback(() => {
    const session = getStoredAdminSession();
    return !session || session.expiresAt <= Date.now();
  }, []);

  const adminFetch = useCallback(
    async <T>(path: string, init: RequestInit = {}) => {
      if (isAdminSessionExpired()) {
        expireAdminSession();
        throw new Error("Admin session expired. Please unlock again.");
      }

      const response = await fetch(path, {
        ...init,
        headers: {
          ...headers,
          ...init.headers,
        },
      });

      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        if (response.status === 401) {
          clearAdminSession();
        }

        throw new Error(body.error || `Request failed with ${response.status}`);
      }

      return body as T;
    },
    [clearAdminSession, expireAdminSession, headers, isAdminSessionExpired]
  );

  // Restore a non-expired session on mount.
  useEffect(() => {
    const session = getStoredAdminSession();

    if (!session) return;

    if (session.expiresAt <= Date.now()) {
      window.localStorage.removeItem(storageKey);
      return;
    }

    storeAdminSession(session.token);
    setToken(session.token);
  }, []);

  // Expire the session exactly when the stored deadline passes.
  useEffect(() => {
    if (!token) return;

    const session = getStoredAdminSession();
    if (!session) return;

    const timeout = window.setTimeout(
      () => expireAdminSession(),
      Math.max(0, session.expiresAt - Date.now())
    );

    return () => window.clearTimeout(timeout);
  }, [token, expireAdminSession]);

  function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextToken = password.trim();

    if (!nextToken) {
      onMessage("Enter the admin password.");
      return;
    }

    storeAdminSession(nextToken);
    setToken(nextToken);
    setPassword("");
  }

  return {
    token,
    isUnlocked: Boolean(token),
    password,
    setPassword,
    handleLogin,
    handleLogout: clearAdminSession,
    adminFetch,
  };
}
