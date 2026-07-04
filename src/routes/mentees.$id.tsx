import { createFileRoute, Link } from "@/lib/router-compat";
import { ArrowLeft, Lock, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { getMentee } from "@/lib/mentees-data";

export const Route = createFileRoute("/mentees/$id")({
  head: () => ({ meta: [{ title: "Mentee profile — GuideMe" }] }),
  component: MenteeProfilePage,
});

function MenteeProfilePage() {
  const { id } = Route.useParams();
  const { user, isAuthenticated } = useAuth();
  const mentee = getMentee(id);

  if (!isAuthenticated) {
    return (
      <CenteredMessage
        title="Please log in"
        body="You must be logged in to view a mentee profile."
        action={
          <Button asChild className="bg-gradient-primary text-primary-foreground">
            <Link to="/login">Log in</Link>
          </Button>
        }
      />
    );
  }

  if (!mentee) {
    return (
      <CenteredMessage
        title="Mentee not found"
        body="We couldn't find this profile."
        action={
          <Button asChild>
            <Link to="/">Go home</Link>
          </Button>
        }
      />
    );
  }

  // Privacy: a mentor can only view a private mentee if they have a booking with them.
  // Mock assumption: mentors in this preview have bookings with all the mentees in
  // their dashboard schedule. We treat any logged-in mentor as having access here.
  const isOwner = user?.role === "mentee" && user?.id === mentee.id;
  const isMenteeViewer = user?.role === "mentee";
  const isMentorViewer = user?.role === "mentor";
  // Mentees may only view their own profile. Mentors may view mentees they've
  // booked (mocked as: any mentor can view in this preview). Admin can view all.
  const canView = isOwner || (!isMenteeViewer && (mentee.isPublic || isMentorViewer || user?.role === "admin"));

  if (!canView) {
    return (
      <CenteredMessage
        title="This profile is private"
        body="The mentee has chosen to keep their profile private."
        icon={<Lock className="h-10 w-10 text-muted-foreground" />}
        action={
          <Button asChild variant="outline">
            <Link to="/mentors">Browse mentors</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Link>
      </Button>

      <Card className="p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <img
            src={mentee.avatar}
            alt={mentee.name}
            className="h-20 w-20 rounded-2xl border bg-muted"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{mentee.name}</h1>
              <Badge variant="secondary" className="gap-1">
                <User className="h-3 w-3" /> Mentee
              </Badge>
              {!mentee.isPublic && (
                <Badge variant="outline" className="gap-1">
                  <Lock className="h-3 w-3" /> Private
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Joined GuideMe in {mentee.joinedYear}
            </p>
            <p className="mt-3 text-sm leading-relaxed">{mentee.bio}</p>

            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Goals
              </p>
              <div className="flex flex-wrap gap-2">
                {mentee.goals.map((g) => (
                  <Badge key={g} variant="outline" className="text-xs">
                    {g}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function CenteredMessage({
  title,
  body,
  action,
  icon,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="container mx-auto max-w-md px-4 py-20 text-center">
      {icon && <div className="mb-4 flex justify-center">{icon}</div>}
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
