import { createFileRoute, Link, useNavigate } from "@/lib/router-compat";
import { useState } from "react";
import { Sparkles, GraduationCap, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAuth, type UserRole } from "@/contexts/AuthContext";
import { supabase } from "@/supabaseClient";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Sign up — GuideMe" }] }),
  component: RegisterPage,
});

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4-5.5 4-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.3 14.6 2.3 12 2.3 6.7 2.3 2.4 6.6 2.4 12s4.3 9.7 9.6 9.7c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.7H12z" />
    </svg>
  );
}

function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState<UserRole>("mentee");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Step 1 - Create auth user in Supabase
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      if (!data.user) {
        toast.error("Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      // Step 2 - Create profile row
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: data.user.id,
          full_name: form.name,
          role: role,
        });

      if (profileError) {
        toast.error("Profile creation failed: " + profileError.message);
        setLoading(false);
        return;
      }

      // Step 3 - If mentor, create mentor_profiles row
      if (role === "mentor") {
        await supabase.from("mentor_profiles").insert({ user_id: data.user.id });
      }

      // Step 4 - Create notification preferences row
      await supabase.from("notification_preferences").insert({ user_id: data.user.id });

      // Step 5 - Update local auth context
      login({
        id: data.user.id,
        name: form.name,
        email: form.email,
        role,
      });

      toast.success("Account created successfully!");
      navigate({ 
        to: role === "mentor" ? "/dashboard/mentor" : "/dashboard/mentee" 
      });

    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    // TODO: Wire your provider's OAuth flow here.
    toast.info("Social login is not wired up yet.");
  };

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg p-6 sm:p-8 shadow-elegant">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-primary">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
          <p className="text-sm text-muted-foreground">Join GuideMe in under a minute.</p>
        </div>

        <Button type="button" variant="outline" onClick={handleGoogle} className="w-full gap-2">
          <GoogleIcon className="h-4 w-4" />
          Continue with Google
        </Button>

        <div className="my-5 flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs uppercase text-muted-foreground">or</span>
          <Separator className="flex-1" />
        </div>

        <div className="mb-6">
          <Label className="mb-2 block">I'm joining as a…</Label>
          <div className="grid grid-cols-2 gap-3">
            <RoleCard
              active={role === "mentee"}
              onClick={() => setRole("mentee")}
              icon={<GraduationCap className="h-5 w-5" />}
              title="Mentee"
              description="Find guidance & grow"
            />
            <RoleCard
              active={role === "mentor"}
              onClick={() => setRole("mentor")}
              icon={<UserCog className="h-5 w-5" />}
              title="Mentor"
              description="Share expertise & earn"
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90"
          >
            {loading ? "Creating account…" : "Create account"}
          </Button>
          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Login Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={async () => {
              const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                  redirectTo: `${window.location.origin}/dashboard/mentee`
                }
              });
              if (error) toast.error("Google login failed. Please try again.");
            }}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}

function RoleCard({
  active,
  onClick,
  icon,
  title,
  description,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition ${
        active
          ? "border-primary bg-accent shadow-elegant"
          : "border-border hover:border-primary/50 hover:bg-accent/40"
      }`}
    >
      <div
        className={`grid h-9 w-9 place-items-center rounded-lg ${
          active ? "bg-gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        }`}
      >
        {icon}
      </div>
      <p className="mt-1 text-sm font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </button>
  );
}
