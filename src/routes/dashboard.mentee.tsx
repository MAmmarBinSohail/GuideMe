import { ProtectedRoute } from "@/components/ProtectedRoute";
import { createFileRoute, useNavigate } from "@/lib/router-compat";
import { useEffect, useState } from "react";
import { Calendar, Clock, Video, Star, Loader2, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/supabaseClient";

export const Route = createFileRoute("/dashboard/mentee")({
  head: () => ({ meta: [{ title: "Mentee Dashboard — GuideMe" }] }),
  component: MenteeDashboard,
});

interface Meeting {
  meeting_link: string;
  status: string;
}

interface Booking {
  id: string;
  scheduled_at: string;
  status: string;
  session_type: string;
  duration_minutes: number;
  availability_id: string | null;
  mentor_profiles: {
    id: string;
    category: string | null;
    profiles: {
      full_name: string;
      profile_picture_url: string | null;
    };
  };
  meetings: Meeting[] | null;
}

function MenteeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchBookings();
  }, [user]);

  async function fetchBookings() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          mentor_profiles (
            id,
            category,
            profiles (
              full_name,
              profile_picture_url
            )
          ),
          meetings (
            meeting_link,
            status
          )
        `)
        .eq("mentee_id", user!.id)
        .order("scheduled_at", { ascending: true });

      if (error) {
        console.error("Failed to fetch bookings:", error);
      } else {
        setBookings(data || []);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(bookingId: string) {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);

      if (error) {
        toast.error("Failed to cancel booking.");
        return;
      }

      await supabase.from("notifications").insert({
          user_id: user!.id,
          type: "booking_cancelled",
          title: "Booking Cancelled",
          message: "Your booking has been cancelled successfully.",
          related_booking_id: bookingId,
        });

      toast.success("Booking cancelled successfully.");
      fetchBookings();

    } catch (err) {
      toast.error("Something went wrong.");
    }
  }

  const now = new Date();

  const upcoming = bookings.filter(
    (b) =>
      b.status === "confirmed" &&
      new Date(b.scheduled_at) > now
  );

  const past = bookings.filter(
    (b) =>
      b.status === "completed" ||
      (b.status === "confirmed" && new Date(b.scheduled_at) <= now)
  );

  const cancelled = bookings.filter(
    (b) => b.status === "cancelled"
  );

  return (
    <ProtectedRoute allowedRoles={["mentee"]}>
      <div className="container mx-auto px-4 py-10">

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            My Sessions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your upcoming and past mentorship sessions.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList>
              
              <TabsTrigger value="upcoming">
                Upcoming ({upcoming.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Past ({past.length})
              </TabsTrigger>
              <TabsTrigger value="cancelled">
                Cancelled ({cancelled.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="mt-6">
              {upcoming.length === 0 ? (
                <EmptyState
                  title="No upcoming sessions"
                  description="Book a session with a mentor and it will appear here."
                  action={
                    <Button
                      size="sm"
                      className="mt-3 bg-gradient-primary text-primary-foreground"
                      onClick={() => navigate({ to: "/mentors" })}
                    >
                      Browse Mentors
                    </Button>
                  }
                />
              ) : (
                <div className="grid gap-4">
                  {upcoming.map((b) => (
                    <BookingCard
                      key={b.id}
                      booking={b}
                      variant="upcoming"
                      onCancel={() =>
                        handleCancel(b.id)
                      }
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="past" className="mt-6">
              {past.length === 0 ? (
                <EmptyState
                  title="No past sessions yet"
                  description="Your completed sessions will be listed here."
                />
              ) : (
                <div className="grid gap-4">
                  {past.map((b) => (
                    <BookingCard key={b.id} booking={b} variant="past" />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="mt-6">
              {cancelled.length === 0 ? (
                <EmptyState
                  title="No cancelled sessions"
                  description="Cancelled bookings will appear here."
                />
              ) : (
                <div className="grid gap-4">
                  {cancelled.map((b) => (
                    <BookingCard
                      key={b.id}
                      booking={b}
                      variant="cancelled"
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </ProtectedRoute>
  );
}

function BookingCard({
  booking,
  variant,
  onCancel,
}: {
  booking: Booking;
  variant: "upcoming" | "past" | "cancelled";
  onCancel?: () => void;
}) {
  const mentorName = booking.mentor_profiles?.profiles?.full_name ?? "Unknown Mentor";
  const mentorAvatar = booking.mentor_profiles?.profiles?.profile_picture_url;
  const category = booking.mentor_profiles?.category ?? "";
  const meetingData = booking.meetings as unknown as Meeting | Meeting[] | null;
  const meetingLink = Array.isArray(meetingData)
    ? meetingData.find((m) => m.status === "active")?.meeting_link
    : meetingData?.meeting_link;

  const initials = mentorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const scheduledDate = new Date(booking.scheduled_at);
  const dateStr = scheduledDate.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = scheduledDate.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">

      {mentorAvatar ? (
        <img
          src={mentorAvatar}
          alt={mentorName}
          className="h-12 w-12 rounded-full border bg-muted object-cover"
        />
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">
          {initials}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">{mentorName}</p>
          {variant === "upcoming" && (
            <Badge className="bg-gradient-primary text-primary-foreground">
              Confirmed
            </Badge>
          )}
          {variant === "past" && (
            <Badge variant="secondary">Completed</Badge>
          )}
          {variant === "cancelled" && (
            <Badge variant="destructive">Cancelled</Badge>
          )}
          {category && (
            <Badge variant="outline" className="capitalize text-[10px]">
              {category}
            </Badge>
          )}
        </div>

        <p className="text-sm text-muted-foreground capitalize">
          {booking.session_type} Session
        </p>

        <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" /> {dateStr}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {timeStr} · {booking.duration_minutes}m
          </span>
        </div>

        {meetingLink && variant === "upcoming" && (
          <a
            href={meetingLink}
            target="_blank"
            rel="noreferrer"
            className="mt-2 flex items-center gap-1 text-xs text-primary underline"
          >
            <Video className="h-3.5 w-3.5" /> Join Meeting
          </a>
        )}
      </div>

      <div className="flex gap-2 sm:flex-col sm:items-end">
        {variant === "upcoming" && (
          <>
            {meetingLink && (
              <Button
                size="sm"
                className="bg-gradient-primary text-primary-foreground hover:opacity-90"
                onClick={() => window.open(meetingLink, "_blank")}
              >
                <Video className="mr-1 h-3.5 w-3.5" /> Join
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={onCancel}
            >
              <XCircle className="mr-1 h-3.5 w-3.5" /> Cancel
            </Button>
          </>
        )}
        {variant === "past" && (
          <Button size="sm" variant="outline">
            <Star className="mr-1 h-3.5 w-3.5" /> Leave Review
          </Button>
        )}
      </div>
    </Card>
  );
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center justify-center gap-2 border-dashed py-16 text-center">
      <Calendar className="h-7 w-7 text-muted-foreground" />
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-sm text-xs text-muted-foreground">{description}</p>
      {action}
    </Card>
  );
}