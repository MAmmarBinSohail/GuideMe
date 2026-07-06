import { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { createFileRoute, useNavigate } from "@/lib/router-compat";
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

interface Payment {
  id: string;
  amount: number;
  payment_status: string;
  payment_type: string;
  paid_at: string | null;
  created_at: string;
  note: string | null;
  bookings: {
    scheduled_at: string;
    duration_minutes: number;
    mentor_profiles: {
      profiles: {
        full_name: string;
      };
    };
  } | null;
}


function MenteeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewBooking, setReviewBooking] = useState<any | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  

  useEffect(() => {
    if (user) {
      fetchBookings();
      fetchPayments();
    }
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

  async function handleSubmitReview(
    bookingId: string,
    mentorId: string,
    rating: number,
    reviewText: string
  ) {
    try {
      // Check if review already exists
      const { data: existing } = await supabase
        .from("reviews")
        .select("id")
        .eq("booking_id", bookingId)
        .maybeSingle();

      if (existing) {
        toast.error("You have already reviewed this session.");
        setReviewBooking(null);
        return;
      }

      const { error } = await supabase
        .from("reviews")
        .insert({
          booking_id: bookingId,
          mentee_id: user!.id,
          mentor_id: mentorId,
          rating,
          review_text: reviewText || null,
        });

      if (error) {
        toast.error("Failed to submit review.");
        return;
      }

      // Update mentor average rating
      const { data: allReviews } = await supabase
        .from("reviews")
        .select("rating")
        .eq("mentor_id", mentorId);

      if (allReviews && allReviews.length > 0) {
        const avgRating =
          allReviews.reduce((sum, r) => sum + r.rating, 0) /
          allReviews.length;

        await supabase
          .from("mentor_profiles")
          .update({ average_rating: Math.round(avgRating * 10) / 10 })
          .eq("id", mentorId);
      }

      toast.success("Review submitted successfully!");
      setReviewBooking(null);
      fetchBookings();

    } catch (err) {
      toast.error("Something went wrong.");
    }
  }

  async function fetchPayments() {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          bookings (
            scheduled_at,
            duration_minutes,
            mentor_profiles (
              profiles (
                full_name
              )
            )
          )
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (!error) {
        setPayments(data || []);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
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
              <TabsTrigger value="payments">
                Payments ({payments.length})
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
                    <BookingCard
                      key={b.id}
                      booking={b}
                      variant="past"
                      onLeaveReview={() => setReviewBooking(b)}
                    />
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
            <TabsContent value="payments" className="mt-6">
              {payments.length === 0 ? (
                <EmptyState
                  title="No payments yet"
                  description="Your payment history will appear here after booking paid sessions."
                />
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => {
                    const mentorName = payment.bookings
                      ?.mentor_profiles?.profiles?.full_name
                      ?? "Unknown Mentor";
                    const scheduledDate = payment.bookings?.scheduled_at
                      ? new Date(payment.bookings.scheduled_at).toLocaleDateString(
                          undefined,
                          { weekday: "short", month: "short", day: "numeric", year: "numeric" }
                        )
                      : "Unknown date";

                    return (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm">
                              {mentorName}
                            </p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${
                              payment.payment_type === 'overage'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-indigo-50 text-indigo-600'
                            }`}>
                              {payment.payment_type === 'overage'
                                ? 'Extra Time'
                                : 'Session'}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              payment.payment_status === 'completed'
                                ? 'bg-green-50 text-green-600'
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              {payment.payment_status}
                            </span>
                          </div>

                          <p className="text-xs text-muted-foreground">
                            {scheduledDate}
                          </p>

                          {payment.note && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {payment.note}
                            </p>
                          )}

                          <p className="text-xs text-muted-foreground mt-0.5">
                            Paid: {payment.paid_at
                              ? new Date(payment.paid_at).toLocaleDateString()
                              : new Date(payment.created_at).toLocaleDateString()
                            }
                          </p>
                        </div>

                        <div className="text-right ml-4">
                          <p className="text-lg font-bold text-gradient-primary">
                            PKR {payment.amount}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {/* Total summary */}
                  <div className="flex items-center justify-between rounded-xl border-2 border-primary/20 bg-indigo-50 p-4">
                    <p className="font-semibold text-sm">Total Spent</p>
                    <p className="text-xl font-bold text-gradient-primary">
                      PKR {payments.reduce((sum, p) => sum + (p.amount || 0), 0)}
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
      <ReviewDialog
          booking={reviewBooking}
          onClose={() => setReviewBooking(null)}
          onSubmit={handleSubmitReview}
        />
    </ProtectedRoute>
  );
}

function BookingCard({
  booking,
  variant,
  onCancel,
  onLeaveReview,
}: {
  booking: Booking;
  variant: "upcoming" | "past" | "cancelled";
  onCancel?: () => void;
  onLeaveReview?: () => void;
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
          <Button
            size="sm"
            variant="outline"
            onClick={onLeaveReview}
          >
            <Star className="mr-1 h-3.5 w-3.5" /> Leave Review
          </Button>
        )}
      </div>
    </Card>
  );
}

function ReviewDialog({
  booking,
  onClose,
  onSubmit,
}: {
  booking: any | null;
  onClose: () => void;
  onSubmit: (bookingId: string, mentorId: string, rating: number, text: string) => void;
}) {
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);

  useEffect(() => {
    if (booking) {
      setRating(5);
      setReviewText("");
      setHoveredRating(0);
    }
  }, [booking]);

  const mentorName = booking?.mentor_profiles?.profiles?.full_name ?? "Mentor";

  return (
    <Dialog open={!!booking} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Leave a Review for {mentorName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Star Rating */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Rating</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                  className="text-2xl transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {rating === 1 ? "Poor" :
               rating === 2 ? "Fair" :
               rating === 3 ? "Good" :
               rating === 4 ? "Very Good" : "Excellent"}
            </p>
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Your review (optional)</p>
            <Textarea
              placeholder="Share your experience with this mentor..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-gradient-primary text-primary-foreground hover:opacity-90"
            onClick={() =>
              onSubmit(
                booking.id,
                booking.mentor_profiles.id,
                rating,
                reviewText
              )
            }
          >
            Submit Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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