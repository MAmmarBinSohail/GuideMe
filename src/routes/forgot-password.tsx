import { createFileRoute, Link } from "@/lib/router-compat";
import { useState } from "react";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/supabaseClient";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot password — GuideMe" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      console.error("Reset password error:", error.message);
    }

    // Always show sent message for security
    // Even if email doesnt exist we dont reveal that
    setLoading(false);
    setSent(true);
  };

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-6 sm:p-8 shadow-elegant">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-primary">
            <Mail className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Forgot password?</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        {sent ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm">
              If an account exists for <span className="font-medium">{email}</span>, a reset
              link has been sent.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link to="/login">
                <ArrowLeft className="mr-1 h-4 w-4" /> Back to login
              </Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90"
            >
              {loading ? "Sending…" : "Send reset link"}
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link to="/login">
                <ArrowLeft className="mr-1 h-4 w-4" /> Back to login
              </Link>
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
