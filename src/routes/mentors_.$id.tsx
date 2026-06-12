import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Star, CheckCircle2, CalendarPlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MOCK_MENTORS } from "@/lib/mock-data";
import { getCategory } from "@/lib/categories";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/mentors_/$id")({
  head: () => ({
    meta: [{ title: `Mentor profile — GuideMe` }],
  }),
  component: MentorProfilePage,
  notFoundComponent: () => (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-semibold">Mentor not found</h1>
      <Button asChild className="mt-4">
        <Link to="/mentors">Back to mentors</Link>
      </Button>
    </div>
  ),
});

function MentorProfilePage() {
  const { id } = Route.useParams();
  const { user, isAuthenticated } = useAuth();
  const mentor = MOCK_MENTORS.find((m) => m.id === id);

  if (!mentor) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">Mentor not found</h1>
        <Button asChild className="mt-4">
          <Link to="/mentors">Back to mentors</Link>
        </Button>
      </div>
    );
  }

  const category = getCategory(mentor.category);
  const CatIcon = category?.icon;
  const isMentor = user?.role === "mentor";

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/mentors">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to mentors
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile card */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <img
              src={mentor.avatar}
              alt={mentor.name}
              className="h-24 w-24 rounded-2xl border bg-muted"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{mentor.name}</h1>
                {mentor.verified && (
                  <Badge className="gap-1 bg-gradient-primary text-primary-foreground">
                    <CheckCircle2 className="h-3 w-3" /> Verified
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{mentor.title}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="font-semibold">{mentor.rating}</span>
                  <span className="text-muted-foreground">({mentor.reviews} reviews)</span>
                </div>
                {category && (
                  <Badge variant="secondary" className="gap-1">
                    {CatIcon && <CatIcon className="h-3 w-3" />}
                    {category.label}
                  </Badge>
                )}
                {mentor.freeFirstSession && (
                  <Badge className="bg-gradient-primary text-primary-foreground">
                    Free first session
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              About
            </h2>
            <p className="text-sm leading-relaxed">{mentor.bio}</p>
          </section>

          <section className="mt-6">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Expertise areas
            </h2>
            <div className="flex flex-wrap gap-2">
              {mentor.expertiseAreas.map((e) => (
                <Badge key={e} variant="outline" className="text-xs">
                  {e}
                </Badge>
              ))}
            </div>
          </section>

          <section className="mt-6">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {mentor.tags.map((t) => (
                <Badge key={t} variant="secondary" className="text-xs">
                  {t}
                </Badge>
              ))}
            </div>
          </section>
        </Card>

        {/* Booking sidebar */}
        <Card className="h-fit p-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Initial session
            </p>
            <p className="mt-1 text-3xl font-bold text-gradient-primary">
              ${mentor.pricePerHour}
              <span className="ml-1 text-sm font-normal text-muted-foreground">/ hr</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Follow-up: ${mentor.followupPrice}/hr
            </p>
          </div>

          {isMentor ? (
            <div className="mt-5 rounded-lg border border-dashed bg-muted/30 p-4 text-center">
              <p className="text-sm font-medium">Mentors cannot book sessions</p>
              <p className="mt-1 text-xs text-muted-foreground">
                You're viewing this profile as a mentor.
              </p>
            </div>
          ) : (
            <>
              <Separator className="my-5" />
              {isAuthenticated ? (
                <Button
                  asChild
                  className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90"
                >
                  <Link to="/book/$mentorId" params={{ mentorId: mentor.id }}>
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    Book Session
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    asChild
                    className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90"
                  >
                    <Link to="/login">Log in to Book</Link>
                  </Button>
                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    You need to sign in before booking a session.
                  </p>
                </>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
