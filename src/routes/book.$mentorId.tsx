import { createFileRoute, Link, useNavigate } from "@/lib/router-compat";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Loader2,
  Star,
  BadgeCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { getCategory } from "@/lib/categories";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/supabaseClient";

export const Route = createFileRoute("/book/$mentorId")({
  head: () => ({ meta: [{ title: "Book a session — GuideMe" }] }),
  component: BookSessionPage,
});

interface MentorProfile {
  id: string;
  user_id: string;
  bio: string | null;
  category: string | null;
  initial_session_price: number | null;
  followup_session_price: number | null;
  is_free_first_session: boolean | null;
  average_rating: number | null;
  session_language: string | null;
  profiles: {
    full_name: string;
    profile_picture_url: string | null;
    is_verified: boolean | null;
  };
}

const DURATION_OPTIONS = [
  { label: "30 minutes", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "1.5 hours", value: 90 },
  { label: "2 hours", value: 120 },
  { label: "2.5 hours", value: 150 },
  { label: "3 hours", value: 180 },
];

function formatDateLong(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function nextNDays(n: number): Date[] {
  const days: Date[] = [];
  const today = new Date();
  for (let i = 1; i <= n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

function BookSessionPage() {
  const { mentorId } = Route.useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [mentor, setMentor] = useState<MentorProfile | null>(null);
  const [loadingMentor, setLoadingMentor] = useState(true);

  const [duration, setDuration] = useState(60);

  const [isFreeEligible, setIsFreeEligible] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [payingNow, setPayingNow] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{
    date: string;
    time: string;
    meetingLink: string;
  } | null>(null);

  const upcomingDays = nextNDays(14);

  useEffect(() => {
    fetchMentor();
  }, [mentorId]);

  useEffect(() => {
    if (user) checkFreeEligibility();
  }, [user, mentorId]);

  async function checkFreeEligibility() {
    setCheckingEligibility(true);
    try {
      const { data, error } = await supabase.rpc(
        "is_eligible_for_free_session",
        {
          p_mentee_id: user!.id,
          p_mentor_id: mentorId,
        }
      );

      if (!error) {
        setIsFreeEligible(data === true);
      }
    } catch (err) {
      console.error("Eligibility check failed:", err);
    } finally {
      setCheckingEligibility(false);
    }
  }

  useEffect(() => {
    if (selectedDate) {
      setSelectedTime(null);
      fetchAvailableTimes();
    }
  }, [selectedDate, duration]);

  async function fetchMentor() {
    setLoadingMentor(true);
    try {
      const { data, error } = await supabase
        .from("mentor_profiles")
        .select(`
          *,
          profiles (
            full_name,
            profile_picture_url,
            is_verified
          )
        `)
        .eq("id", mentorId)
        .single();

      if (error || !data) {
        console.error("Mentor not found:", error);
      } else {
        setMentor(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMentor(false);
    }
  }

  async function fetchAvailableTimes() {
    if (!selectedDate) return;
    setLoadingTimes(true);
    try {
      const dateStr = selectedDate.toISOString().split("T")[0];

      const { data, error } = await supabase.rpc(
        "get_available_start_times",
        {
          p_mentor_id: mentorId,
          p_date: dateStr,
          p_duration_minutes: duration,
        }
      );

      if (error) {
        console.error("Failed to fetch times:", error);
        setAvailableTimes([]);
      } else {
        setAvailableTimes((data || []).map((row: any) => row.start_time));
      }
    } catch (err) {
      console.error(err);
      setAvailableTimes([]);
    } finally {
      setLoadingTimes(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">
          Please log in to book a session
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You need an account to confirm bookings with a mentor.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button asChild className="bg-gradient-primary text-primary-foreground">
            <Link to="/login">Log in</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/register">Create account</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (user?.role === "mentor") {
    return (
      <div className="container mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Booking is for mentees only</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Mentor accounts cannot book sessions with other mentors.
        </p>
        <Button asChild className="mt-6">
          <Link to="/mentors">Back to mentors</Link>
        </Button>
      </div>
    );
  }

  if (loadingMentor) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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

  const category = getCategory(mentor.category ?? "");
  const CatIcon = category?.icon;
  const isFreeNow = isFreeEligible;
  const sessionPrice = isFreeNow ? 0 : (mentor.initial_session_price ?? 0);
  const priceLabel = isFreeNow ? "Free" : `PKR ${sessionPrice}`;

  const initials = mentor.profiles.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function handleConfirm() {
    if (!selectedDate || !selectedTime || !user) return;

    if (sessionPrice > 0) {
      // Paid session — show payment screen first
      setShowPayment(true);
      return;
    }

    // Free session — book immediately
    await createBookingRecord();
  }

  async function createBookingRecord() {
    if (!selectedDate || !selectedTime || !user) return;
    setSubmitting(true);

    try {
      const dateStr = selectedDate.toISOString().split("T")[0];
      const scheduledAt = `${dateStr}T${selectedTime}`;

      const { data: overlapCheck } = await supabase.rpc(
        "check_booking_overlap",
        {
          p_mentor_id: mentorId,
          p_scheduled_at: scheduledAt,
          p_duration_minutes: duration,
        }
      );

      if (overlapCheck === true) {
        toast.error("This time was just taken. Please pick another.");
        setSelectedTime(null);
        fetchAvailableTimes();
        setSubmitting(false);
        setShowPayment(false);
        return;
      }

      const { data: newBooking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          mentee_id: user.id,
          mentor_id: mentorId,
          scheduled_at: scheduledAt,
          status: "confirmed",
          session_type: "initial",
          duration_minutes: duration,
          is_paid: sessionPrice > 0,
        })
        .select()
        .single();

      if (bookingError || !newBooking) {
        toast.error("Booking failed. Please try again.");
        setSubmitting(false);
        return;
      }

      // If paid, create the payment record
      if (sessionPrice > 0) {
        await supabase.from("payments").insert({
          booking_id: newBooking.id,
          user_id: user.id,
          amount: sessionPrice,
          payment_status: "completed",
          payment_type: "session",
          paid_at: new Date().toISOString(),
        });
      }

      const meetingLink = `https://meet.jit.si/guideme-${newBooking.id.substring(0, 8)}`;

      await supabase.from("meetings").insert({
        booking_id: newBooking.id,
        meeting_link: meetingLink,
        status: "active",
      });

      await supabase.from("notifications").insert({
        user_id: user.id,
        type: "booking_confirmed",
        title: "Booking Confirmed!",
        message: `Your session with ${mentor!.profiles.full_name} is confirmed for ${formatDateLong(selectedDate)} at ${selectedTime}. Meeting link: ${meetingLink}`,
        related_booking_id: newBooking.id,
      });

      setShowPayment(false);
      setSuccess({
        date: formatDateLong(selectedDate),
        time: selectedTime,
        meetingLink,
      });

      toast.success("Booking confirmed!");

    } catch (err) {
      console.error("Booking error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
      setPayingNow(false);
    }
  }

  async function handlePayNow() {
    setPayingNow(true);
    // Simulate payment processing delay
    await new Promise((r) => setTimeout(r, 1200));
    await createBookingRecord();
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/mentors">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to mentors
        </Link>
      </Button>

      {/* Mentor Summary */}
      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {mentor.profiles.profile_picture_url ? (
            <img
              src={mentor.profiles.profile_picture_url}
              alt={mentor.profiles.full_name}
              className="h-16 w-16 rounded-2xl border bg-muted object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-primary text-xl font-bold text-primary-foreground">
              {initials}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">
                {mentor.profiles.full_name}
              </h1>
              {mentor.profiles.is_verified && (
                <BadgeCheck className="h-5 w-5 text-primary" />
              )}
              {category && (
                <Badge variant="secondary" className="gap-1">
                  {CatIcon && <CatIcon className="h-3 w-3" />}
                  {category.label}
                </Badge>
              )}
              {isFreeNow && (
                <Badge className="bg-gradient-primary text-primary-foreground">
                  Free first session
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground capitalize">
              {mentor.category} Mentor
            </p>
            <div className="mt-1 flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="font-semibold">
                {mentor.average_rating?.toFixed(1) ?? "New"}
              </span>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Starting Price
            </p>
            <p className="text-lg font-bold text-gradient-primary">
              {priceLabel}
            </p>
          </div>
        </div>
      </Card>

      {/* Duration Selection */}
      <Card className="mt-5 p-5">
        <h2 className="mb-3 text-base font-semibold">
          Choose session duration
        </h2>
        <div className="flex flex-wrap gap-2">
          {DURATION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDuration(opt.value)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                duration === opt.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-background hover:border-primary/50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Date Selection */}
      <Card className="mt-5 p-5">
        <h2 className="mb-1 text-base font-semibold">Select a date</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Choose a date, then pick an available start time.
        </p>

        <div className="-mx-1 flex gap-2 overflow-x-auto pb-2">
          {upcomingDays.map((d) => {
            const active = selectedDate?.toDateString() === d.toDateString();
            return (
              <button
                key={d.toISOString()}
                onClick={() => setSelectedDate(d)}
                className={`shrink-0 rounded-xl border px-3 py-2 text-center text-xs transition ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-background hover:border-primary/50"
                }`}
              >
                <div className="font-medium">
                  {d.toLocaleDateString(undefined, { weekday: "short" })}
                </div>
                <div className="text-base font-bold leading-tight">
                  {d.toLocaleDateString(undefined, { day: "numeric" })}
                </div>
                <div className="opacity-80">
                  {d.toLocaleDateString(undefined, { month: "short" })}
                </div>
              </button>
            );
          })}
        </div>

        <Separator className="my-4" />

        {!selectedDate ? (
          <p className="text-sm text-muted-foreground">
            Select a date above to see available times.
          </p>
        ) : loadingTimes ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : availableTimes.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No available times for this date and duration. Try a different date or shorter duration.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {availableTimes.map((t) => {
              const selected = t === selectedTime;
              return (
                <button
                  key={t}
                  onClick={() => setSelectedTime(t)}
                  className={`rounded-lg border p-2 text-xs font-medium transition ${
                    selected
                      ? "border-primary bg-primary/10 ring-2 ring-primary"
                      : "bg-background hover:border-primary/50"
                  }`}
                >
                  <Clock className="inline h-3 w-3 mr-1" />
                  {t.slice(0, 5)}
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* Booking Summary */}
      <Card className="mt-5 p-5">
        <h2 className="mb-3 text-base font-semibold">Booking summary</h2>
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <SummaryRow
            label="Date & time"
            value={
              selectedDate && selectedTime
                ? `${formatDateLong(selectedDate)} at ${selectedTime.slice(0, 5)}`
                : "Select date and time"
            }
            icon={<CalendarIcon className="h-4 w-4" />}
          />
          <SummaryRow label="Session type" value="Initial Session" />
          <SummaryRow
            label="Duration"
            value={
              DURATION_OPTIONS.find((d) => d.value === duration)?.label ?? ""
            }
          />
          <SummaryRow label="Price" value={priceLabel} highlight />
        </div>

        <Button
          disabled={!selectedDate || !selectedTime || submitting}
          onClick={handleConfirm}
          className="mt-5 w-full bg-gradient-primary text-primary-foreground hover:opacity-90 sm:w-auto"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Confirming…
            </>
          ) : (
            "Confirm Booking"
          )}
        </Button>
      </Card>

      {/* Success Modal */}
      <Dialog open={!!success} onOpenChange={(o) => !o && setSuccess(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600 dark:text-green-500">
              <CheckCircle2 className="h-5 w-5" /> Booking Confirmed
            </DialogTitle>
          </DialogHeader>
          {success && (
            <div className="space-y-3 text-sm">
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="font-semibold">{mentor.profiles.full_name}</p>
                <p className="text-muted-foreground">
                  {success.date} at {success.time.slice(0, 5)}
                </p>
              </div>

              <div className="rounded-lg border bg-blue-50 p-3 dark:bg-blue-950">
                <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                  Your Meeting Link
                </p>
                <a
                  href={success.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 underline break-all dark:text-blue-400"
                >
                  {success.meetingLink}
                </a>
              </div>

              <p className="text-muted-foreground">
                Your meeting link is also saved in your notifications
                and dashboard.
              </p>

              <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                <Button
                  className="flex-1 bg-gradient-primary text-primary-foreground hover:opacity-90"
                  onClick={() => navigate({ to: "/dashboard/mentee" })}
                >
                  Go to Dashboard
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate({ to: "/notifications" })}
                >
                  View Notifications
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Mock Payment Modal */}
      <Dialog open={showPayment} onOpenChange={(o) => !payingNow && setShowPayment(o)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Mentor</span>
                <span className="font-medium">{mentor.profiles.full_name}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Session</span>
                <span className="font-medium">
                  {DURATION_OPTIONS.find((d) => d.value === duration)?.label}
                </span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span className="text-gradient-primary">PKR {sessionPrice}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              This is a simulated payment for demonstration purposes.
              No real transaction will occur.
            </p>

            <Button
              disabled={payingNow}
              onClick={handlePayNow}
              className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90"
            >
              {payingNow ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Payment…
                </>
              ) : (
                `Pay PKR ${sessionPrice} Now`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 flex items-center gap-1.5 ${
          highlight
            ? "text-base font-bold text-gradient-primary"
            : "text-sm font-medium"
        }`}
      >
        {icon}
        {value}
      </p>
    </div>
  );
}