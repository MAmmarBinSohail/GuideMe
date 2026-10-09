import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/supabaseClient";

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
  loading: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  updateAvatar: (avatar: string) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in via Supabase session
    async function loadSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          // Fetch profile from database
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (profile) {
            console.log(
              "loadSession profile:",
              profile.full_name,
              "is_blocked:",
              profile.is_blocked,
            );

            if (profile.is_blocked) {
              console.log("loadSession: user is blocked, signing out");
              await supabase.auth.signOut();
              setUser(null);
              setLoading(false);
              return;
            }

            setUser({
              id: session.user.id,
              name: profile.full_name,
              email: session.user.email!,
              role: profile.role,
              avatar: profile.profile_picture_url || undefined,
            });
          }
        }
      } catch {
        // ignore errors
      } finally {
        setLoading(false);
      }
    }

    loadSession();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        return;
      }

      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, full_name, role, profile_picture_url, is_verified, is_blocked")
          .eq("id", session.user.id)
          .single();

        if (profile) {
          if (profile.is_blocked) {
            console.log("Blocked user detected, signing out");
            setUser(null);
            await supabase.auth.signOut();
            return;
          }

          // Handle Google OAuth new user with no role/name
          if (!profile.role || !profile.full_name) {
            await supabase
              .from("profiles")
              .update({
                full_name:
                  profile.full_name ||
                  session.user.user_metadata?.full_name ||
                  session.user.email?.split("@")[0],
                email: session.user.email,
              })
              .eq("id", session.user.id);
          }

          setUser({
            id: session.user.id,
            name:
              profile.full_name ||
              session.user.user_metadata?.full_name ||
              session.user.email?.split("@")[0] ||
              "",
            email: session.user.email!,
            role: profile.role || "mentee",
            avatar:
              profile.profile_picture_url || session.user.user_metadata?.avatar_url || undefined,
          });
        }
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = (userData: AuthUser) => {
    setUser(userData);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateAvatar = (avatar: string) => {
    if (!user) return;
    setUser({ ...user, avatar });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
        updateAvatar,
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
