import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Calendar, Clock, Video, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MOCK_UPCOMING_SESSIONS,
  MOCK_PAST_SESSIONS,
  type Session,
} from "@/lib/mock-data";
import { RatingPromptModal } from "@/components/RatingPromptModal";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/dashboard/mentee")({
  head: () => ({ meta: [{ title: "Mentee Dashboard — GuideMe" }] }),
  component: MenteeDashboard,
});

function MenteeDashboard() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!isAuthenticated) navigate({ to: "/login" });
  }, [isAuthenticated, navigate]);

  const [pastSessions, setPastSessions] = useState<Session[]>(MOCK_PAST_SESSIONS);
  const [ratingSession, setRatingSession] = useState<Session | null>(null);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [skippedIds, setSkippedIds] = useState<string[]>([]);

  if (!isAuthenticated) return null;


  // Auto-popup the first unreviewed completed session (inDrive-style).
  const pendingReview = useMemo(
    () =>
      pastSessions.find(
        (s) => s.status === "completed" && !s.hasReview && !skippedIds.includes(s.id),
      ) ?? null,
    [pastSessions, skippedIds],
  );

  useEffect(() => {
    if (pendingReview && !ratingOpen) {
      // Slight delay so the dashboard renders first.
      const t = setTimeout(() => {
        setRatingSession(pendingReview);
        setRatingOpen(true);
      }, 600);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingReview]);

  const handleSubmitReview = (sessionId: string, _rating: number, _comment: string) => {
    setPastSessions((list) =>
      list.map((s) => (s.id === sessionId ? { ...s, hasReview: true } : s)),
    );
  };

  const handleClose = () => {
    if (ratingSession) {
      setSkippedIds((ids) => [...ids, ratingSession.id]);
    }
    setRatingOpen(false);
    setRatingSession(null);
  };

  const openRatingFor = (s: Session) => {
    setRatingSession(s);
    setRatingOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">My Sessions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your upcoming and past mentorship sessions.
        </p>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({MOCK_UPCOMING_SESSIONS.length})
          </TabsTrigger>
          <TabsTrigger value="past">Past ({pastSessions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {MOCK_UPCOMING_SESSIONS.length === 0 ? (
            <EmptyState
              title="No upcoming sessions"
              description="Book a session with a mentor and it will appear here."
            />
          ) : (
            <div className="grid gap-4">
              {MOCK_UPCOMING_SESSIONS.map((s) => (
                <SessionCard key={s.id} session={s} variant="upcoming" />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          {pastSessions.length === 0 ? (
            <EmptyState
              title="No past sessions yet"
              description="Your completed sessions will be listed here."
            />
          ) : (
            <div className="grid gap-4">
              {pastSessions.map((s) => (
                <SessionCard
                  key={s.id}
                  session={s}
                  variant="past"
                  onLeaveReview={() => openRatingFor(s)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <RatingPromptModal
        session={ratingSession}
        open={ratingOpen}
        onClose={handleClose}
        onSubmit={handleSubmitReview}
      />
    </div>
  );
}

function SessionCard({
  session,
  variant,
  onLeaveReview,
}: {
  session: Session;
  variant: "upcoming" | "past";
  onLeaveReview?: () => void;
}) {
  return (
    <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
      <img
        src={session.mentorAvatar}
        alt={session.mentorName}
        className="h-12 w-12 rounded-full border bg-muted"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">{session.mentorName}</p>
          {variant === "upcoming" ? (
            <Badge className="bg-gradient-primary text-primary-foreground">Confirmed</Badge>
          ) : (
            <>
              <Badge variant="secondary">Completed</Badge>
              {session.hasReview && (
                <Badge variant="outline" className="gap-1 text-[10px]">
                  <Star className="h-3 w-3 fill-primary text-primary" /> Reviewed
                </Badge>
              )}
            </>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{session.topic}</p>
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" /> {session.date}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {session.time} · {session.durationMinutes}m
          </span>
        </div>
      </div>
      <div className="flex gap-2 sm:flex-col sm:items-end">
        {variant === "upcoming" ? (
          <Button size="sm" className="bg-gradient-primary text-primary-foreground hover:opacity-90">
            <Video className="mr-1 h-3.5 w-3.5" /> Join
          </Button>
        ) : session.hasReview ? (
          <Button size="sm" variant="outline" disabled>
            Reviewed
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={onLeaveReview}>
            <Star className="mr-1 h-3.5 w-3.5" /> Leave review
          </Button>
        )}
      </div>
    </Card>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card className="flex flex-col items-center justify-center gap-2 border-dashed py-16 text-center">
      <Calendar className="h-7 w-7 text-muted-foreground" />
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-sm text-xs text-muted-foreground">{description}</p>
    </Card>
  );
}
