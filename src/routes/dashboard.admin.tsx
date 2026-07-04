import { createFileRoute, Link } from "@/lib/router-compat";
import { ShieldCheck, Wrench } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard — GuideMe" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Platform-level controls for managing users, mentors, and bookings.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Users", value: "—", sub: "Total registered" },
          { label: "Mentors", value: "—", sub: "Active mentor profiles" },
          { label: "Bookings", value: "—", sub: "This month" },
          { label: "Payments", value: "—", sub: "Total volume" },
          { label: "Reviews", value: "—", sub: "All-time average" },
          { label: "Reports", value: "—", sub: "Pending review" },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {s.label}
            </p>
            <p className="mt-2 text-3xl font-bold text-gradient-primary">{s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-8 flex flex-col items-center gap-3 border-dashed py-16 text-center">
        <Wrench className="h-7 w-7 text-muted-foreground" />
        <p className="text-sm font-medium">Admin tooling coming soon</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          User management, mentor verification, payouts, and moderation will land here.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link to="/">Back to home</Link>
        </Button>
      </Card>
    </div>
  );
}
