"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { apiGet, scheduleTokenRefresh } from "@/lib/api";
import { connectSocket, disconnectSocket } from "@/lib/socket";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const { accessToken, logout, setAuth } = useAuth.getState();
    if (!accessToken) return;

    // Validate session & refresh user data on mount
    apiGet<{
      id: string;
      phone: string;
      firstName: string;
      lastName: string;
      role: string;
      avatarUrl?: string;
    }>("/users/me", accessToken)
      .then((user) => {
        // Update user data in case it changed (e.g. name, role)
        const { refreshToken } = useAuth.getState();
        if (refreshToken) {
          setAuth(user, accessToken, refreshToken);
        }
        // Schedule proactive token refresh
        scheduleTokenRefresh();
        // Connect WebSocket for real-time messaging
        connectSocket(accessToken);
      })
      .catch(() => {
        // Token is invalid or expired — clear auth state
        disconnectSocket();
        logout();
      });

    return () => {
      disconnectSocket();
    };
  }, []);

  return <>{children}</>;
}
