import { createFileRoute, useNavigate } from "@/lib/router-compat";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/supabaseClient";

export const Route = createFileRoute("/unsubscribe")({
  head: () => ({ meta: [{ title: "Unsubscribe — GuideMe" }] }),
  component: UnsubscribePage,
});

function UnsubscribePage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "notfound">("loading");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");

    if (!emailParam) {
      setStatus("error");
      return;
    }

    setEmail(emailParam);
    handleUnsubscribe(emailParam);
  }, []);

  async function handleUnsubscribe(emailParam: string) {
    const { data, error } = await supabase
      .from("subscribers")
      .update({ is_active: false })
      .eq("email", emailParam.toLowerCase())
      .select();

    if (error || !data || data.length === 0) {
      setStatus("notfound");
      return;
    }

    setStatus("success");
  }

  return (
    <div className="container mx-auto max-w-md px-4 py-20 text-center">
      {status === "loading" && (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Processing your request...</p>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center gap-4">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
          <h1 className="text-2xl font-bold">Unsubscribed</h1>
          <p className="text-sm text-muted-foreground">
            <strong>{email}</strong> has been successfully unsubscribed from GuideMe newsletters.
            You will no longer receive updates from us.
          </p>
          <Button onClick={() => navigate({ to: "/" })}>
            Back to Home
          </Button>
        </div>
      )}

      {status === "notfound" && (
        <div className="flex flex-col items-center gap-4">
          <XCircle className="h-12 w-12 text-amber-500" />
          <h1 className="text-2xl font-bold">Not Found</h1>
          <p className="text-sm text-muted-foreground">
            This email address was not found in our subscriber list.
            It may have already been unsubscribed.
          </p>
          <Button onClick={() => navigate({ to: "/" })}>
            Back to Home
          </Button>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-4">
          <XCircle className="h-12 w-12 text-destructive" />
          <h1 className="text-2xl font-bold">Invalid Link</h1>
          <p className="text-sm text-muted-foreground">
            This unsubscribe link is invalid or has expired.
          </p>
          <Button onClick={() => navigate({ to: "/" })}>
            Back to Home
          </Button>
        </div>
      )}
    </div>
  );
}