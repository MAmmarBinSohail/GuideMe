import { createContext, useContext, useState, type ReactNode } from "react";

export type UserRole = "mentee" | "mentor" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  updateAvatar: (avatar: string) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login: setUser,
        logout: () => setUser(null),
        updateAvatar: (avatar) =>
          setUser((u) => (u ? { ...u, avatar } : u)),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
