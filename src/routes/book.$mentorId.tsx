import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Loader2,
  Star,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { MOCK_MENTORS } from "@/lib/mock-data";
import { getCategory } from "@/lib/categories";
import { useAuth } from "@/contexts/AuthContext";
import {
  bookSlot,
  getMentorAvailability,
  isSlotBooked,
  useBookings,
} from "@/lib/bookings-store";

export const Route = createFileRoute("/book/$mentorId")({
  head: () => ({ meta: [{ title: "Book a session — GuideMe" }] }),
  component: BookSessionPage,
});

function formatDateLong(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function BookSessionPage() {
  const { mentorId } = Route.useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  useBookings(); // re-render on store changes

  const mentor = MOCK_MENTORS.find((m) => m.id === mentorId);
  const availability = useMemo(() => getMentorAvailability(mentorId), [mentorId]);

  const dates = useMemo(
    () => Array.from(new Set(availability.map((s) => s.date))),
    [availability],
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(dates[0] ?? null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ date: string; time: string } | null>(null);

  // Not logged in
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Please log in to book a session</h1>
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

  // Mentors cannot book
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
  const slotsForDate = availability.filter((s) => s.date === selectedDate);
  const selectedSlot = availability.find((s) => s.id === selectedSlotId);

  const isFreeFirst = mentor.freeFirstSession;
  const sessionType = isFreeFirst ? "Initial Session" : "Initial Session";
  const priceLabel = isFreeFirst ? "Free" : `PKR ${mentor.pricePerHour * 280}`;

  const handleConfirm = async () => {
    if (!selectedSlot) return;
    if (isSlotBooked(mentorId, selectedSlot.id) || selectedSlot.preBooked) {
      toast.error("This slot was just taken. Please pick another.");
      setSelectedSlotId(null);
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 900));
    const ok = bookSlot(mentorId, selectedSlot.id);
    setSubmitting(false);
    if (!ok) {
      toast.error("This slot was just taken. Please pick another.");
      setSelectedSlotId(null);
      return;
    }
    setSuccess({
      date: formatDateLong(selectedSlot.date),
      time: `${selectedSlot.startTime} – ${selectedSlot.endTime}`,
    });
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/mentors/$id" params={{ id: mentorId }}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to profile
        </Link>
      </Button>

      {/* TOP — mentor summary */}
      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <img
            src={mentor.avatar}
            alt={mentor.name}
            className="h-16 w-16 rounded-2xl border bg-muted"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">{mentor.name}</h1>
              {category && (
                <Badge variant="secondary" className="gap-1">
                  {CatIcon && <CatIcon className="h-3 w-3" />}
                  {category.label}
                </Badge>
              )}
              {isFreeFirst && (
                <Badge className="bg-gradient-primary text-primary-foreground">
                  Free first session
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{mentor.title}</p>
            <div className="mt-1 flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="font-semibold">{mentor.rating}</span>
              <span className="text-muted-foreground">({mentor.reviews} reviews)</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Initial</p>
            <p className="text-lg font-bold text-gradient-primary">
              {isFreeFirst ? "Free" : `$${mentor.pricePerHour}/hr`}
            </p>
          </div>
        </div>
      </Card>

      {/* MIDDLE — pick a slot */}
      <Card className="mt-5 p-5">
        <h2 className="mb-1 text-base font-semibold">Select a time slot</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Choose a date with availability, then pick a slot.
        </p>

        <div className="-mx-1 flex gap-2 overflow-x-auto pb-2">
          {dates.map((d) => {
            const active = d === selectedDate;
            const day = new Date(d + "T00:00:00");
            return (
              <button
                key={d}
                onClick={() => {
                  setSelectedDate(d);
                  setSelectedSlotId(null);
                }}
                className={`shrink-0 rounded-xl border px-3 py-2 text-center text-xs transition ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-background hover:border-primary/50"
                }`}
              >
                <div className="font-medium">
                  {day.toLocaleDateString(undefined, { weekday: "short" })}
                </div>
                <div className="text-base font-bold leading-tight">
                  {day.toLocaleDateString(undefined, { day: "numeric" })}
                </div>
                <div className="opacity-80">
                  {day.toLocaleDateString(undefined, { month: "short" })}
                </div>
              </button>
            );
          })}
        </div>

        <Separator className="my-4" />

        {selectedDate ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {slotsForDate.map((s) => {
              const taken = s.preBooked || isSlotBooked(mentorId, s.id);
              const selected = s.id === selectedSlotId;
              return (
                <button
                  key={s.id}
                  disabled={taken}
                  onClick={() => setSelectedSlotId(s.id)}
                  className={`rounded-xl border p-3 text-left text-xs transition ${
                    taken
                      ? "cursor-not-allowed border-dashed bg-muted/40 text-muted-foreground opacity-60"
                      : selected
                        ? "border-primary bg-primary/10 ring-2 ring-primary"
                        : "bg-background hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-1 font-semibold">
                    <Clock className="h-3.5 w-3.5" /> {s.startTime}
                  </div>
                  <div className="mt-0.5 text-muted-foreground">
                    – {s.endTime} · {s.durationMinutes}m
                  </div>
                  {taken && <div className="mt-1 text-[10px] font-medium">Booked</div>}
                </button>
              );
            })}
            {slotsForDate.length === 0 && (
              <p className="col-span-full py-6 text-center text-sm text-muted-foreground">
                No availability for this date.
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No upcoming availability.</p>
        )}
      </Card>

      {/* BOTTOM — summary + confirm */}
      <Card className="mt-5 p-5">
        <h2 className="mb-3 text-base font-semibold">Booking summary</h2>
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <SummaryRow
            label="Date & time"
            value={
              selectedSlot
                ? `${formatDateLong(selectedSlot.date)} · ${selectedSlot.startTime} – ${selectedSlot.endTime}`
                : "Select a slot"
            }
            icon={<CalendarIcon className="h-4 w-4" />}
          />
          <SummaryRow label="Session type" value={sessionType} />
          <SummaryRow label="Duration" value={selectedSlot ? `${selectedSlot.durationMinutes} minutes` : "—"} />
          <SummaryRow label="Price" value={priceLabel} highlight />
        </div>

        <Button
          disabled={!selectedSlot || submitting}
          onClick={handleConfirm}
          className="mt-5 w-full bg-gradient-primary text-primary-foreground hover:opacity-90 sm:w-auto"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirming…
            </>
          ) : (
            "Confirm Booking"
          )}
        </Button>
      </Card>

      {/* Success modal */}
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
                <p className="font-semibold">{mentor.name}</p>
                <p className="text-muted-foreground">
                  {success.date} · {success.time}
                </p>
              </div>
              <p className="text-muted-foreground">
                A meeting link has been sent to your email address and is also available in your
                notifications.
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
                  onClick={() => {
                    setSuccess(null);
                    toast.info("Notifications will live in the dashboard soon.");
                  }}
                >
                  View Notifications
                </Button>
              </div>
            </div>
          )}
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
          highlight ? "text-base font-bold text-gradient-primary" : "text-sm font-medium"
        }`}
      >
        {icon}
        {value}
      </p>
    </div>
  );
}
