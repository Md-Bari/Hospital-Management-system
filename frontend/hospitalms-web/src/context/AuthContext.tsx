"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { UserDto, AuthResponseDto, ApiResponse } from "@/types/auth";
import { apiClient } from "@/lib/api-client";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: UserDto | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    // Check local storage for initial session
    const storedToken = localStorage.getItem("hospitalms_token");
    const storedUser = localStorage.getItem("hospitalms_user");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("hospitalms_token");
        localStorage.removeItem("hospitalms_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponseDto>>("/auth/login", {
        email,
        password,
      });

      if (response.data.success && response.data.data) {
        const authData = response.data.data;
        setToken(authData.accessToken);
        setUser(authData.user);

        localStorage.setItem("hospitalms_token", authData.accessToken);
        localStorage.setItem("hospitalms_refresh", authData.refreshToken);
        localStorage.setItem("hospitalms_user", JSON.stringify(authData.user));

        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    try {
      apiClient.post("/auth/logout");
    } catch {
      // Ignore network errors on logout
    }

    setToken(null);
    setUser(null);
    localStorage.removeItem("hospitalms_token");
    localStorage.removeItem("hospitalms_refresh");
    localStorage.removeItem("hospitalms_user");
    router.push("/login");
  };

  const hasRole = (role: string): boolean => {
    return user?.roles.includes(role) ?? false;
  };

  const hasPermission = (permission: string): boolean => {
    return user?.permissions.includes(permission) ?? false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        hasRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

