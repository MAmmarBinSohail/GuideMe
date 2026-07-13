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
