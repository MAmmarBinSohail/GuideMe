import { ProtectedRoute } from "@/components/ProtectedRoute";
import { createFileRoute, Link } from "@/lib/router-compat";
import { useEffect, useState } from "react";
import {
  BadgeCheck,
  CalendarClock,
  CalendarDays,
  Check,
  Clock,
  DollarSign,
  Lock,
  Plus,
  ShieldCheck,
  Trash2,
  User,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/supabaseClient";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/dashboard/mentor")({
  head: () => ({ meta: [{ title: "Mentor Dashboard — GuideMe" }] }),
  component: MentorDashboard,
});

type RequestStatus = "pending" | "accepted" | "declined";

function MentorDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescheduling, setRescheduling] = useState<any | null>(null);
  const [overageBooking, setOverageBooking] = useState<any | null>(null);

  useEffect(() => {
    if (user) fetchBookings();
  }, [user]);

  async function fetchBookings() {
    setLoading(true);
    try {
      // Get mentor profile first
      const { data: mentorProfile } = await supabase
        .from("mentor_profiles")
        .select("id")
        .eq("user_id", user!.id)
        .single();

      if (!mentorProfile) {
        setLoading(false);
        return;
      }

      // Get all bookings for this mentor
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          profiles!bookings_mentee_id_fkey (
            full_name,
            profile_picture_url
          ),
          meetings (
            meeting_link
          )
        `)
        .eq("mentor_id", mentorProfile.id)
        .order("scheduled_at", { ascending: true });

      if (!error) {
        setBookings(data || []);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(bookingId: string) {
    await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId);

    toast.success("Booking cancelled.");
    fetchBookings();
  }

  async function handleMarkComplete(bookingId: string) {
    const { error } = await supabase
      .from("bookings")
      .update({ status: "completed" })
      .eq("id", bookingId);

    if (error) {
      toast.error("Failed to mark session as completed.");
      return;
    }

    toast.success("Session marked as completed.");
    fetchBookings();
  }

  async function handleAddOverage(
    bookingId: string,
    menteeId: string,
    extraMinutes: number,
    overageRate: number
  ) {
    const amount = extraMinutes * overageRate;

    const { error } = await supabase.from("payments").insert({
      booking_id: bookingId,
      user_id: menteeId,
      amount,
      payment_status: "completed",
      payment_type: "overage",
      paid_at: new Date().toISOString(),
      note: `Extra ${extraMinutes} minutes at PKR ${overageRate}/min`,
    });

    if (error) {
      toast.error("Failed to add overage charge.");
      return;
    }

    await supabase.from("notifications").insert({
      user_id: menteeId,
      type: "payment",
      title: "Additional Charge for Extended Session",
      message: `Your session ran ${extraMinutes} extra minutes. An additional charge of PKR ${amount} has been recorded.`,
      related_booking_id: bookingId,
    });

    toast.success(`Overage charge of PKR ${amount} recorded.`);
    setOverageBooking(null);
    fetchBookings();
  }

  const now = new Date();

  const upcoming = bookings.filter(
    (b) => b.status === "confirmed" && new Date(b.scheduled_at) > now
  );

  const past = bookings.filter(
    (b) => b.status === "completed" ||
    (b.status === "confirmed" && new Date(b.scheduled_at) <= now)
  );

  const cancelled = bookings.filter((b) => b.status === "cancelled");

  const earningsThisMonth = upcoming.reduce(
    (sum: number, b: any) => sum + (b.initial_session_price ?? 0), 0
  );

  return (
    <ProtectedRoute allowedRoles={["mentor"]}>
      <div className="container mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Mentor Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your schedule, requests, and earnings.
          </p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <StatCard label="Upcoming" value={String(upcoming.length)} sub="scheduled sessions" />
          <StatCard label="Past sessions" value={String(past.length)} sub="completed" />
          <StatCard label="Cancelled" value={String(cancelled.length)} sub="this month" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <Tabs defaultValue="upcoming">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="upcoming">
                Upcoming ({upcoming.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Past ({past.length})
              </TabsTrigger>
              <TabsTrigger value="cancelled">
                Cancelled ({cancelled.length})
              </TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="availability">Availability</TabsTrigger>
              <TabsTrigger value="verification">Verification</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="mt-6">
              {upcoming.length === 0 ? (
                <Card className="flex flex-col items-center justify-center gap-2 border-dashed py-16 text-center">
                  <CalendarDays className="h-7 w-7 text-muted-foreground" />
                  <p className="text-sm font-medium">No upcoming sessions</p>
                  <p className="text-xs text-muted-foreground">
                    Bookings from mentees will appear here.
                  </p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {upcoming.map((b) => (
                    <MentorBookingCard
                      key={b.id}
                      booking={b}
                      variant="upcoming"
                      onCancel={() => handleCancel(b.id)}
                      onMarkComplete={() => handleMarkComplete(b.id)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="past" className="mt-6">
              {past.length === 0 ? (
                <Card className="flex flex-col items-center justify-center gap-2 border-dashed py-16 text-center">
                  <CalendarClock className="h-7 w-7 text-muted-foreground" />
                  <p className="text-sm font-medium">No past sessions yet</p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {past.map((b) => (
                    <MentorBookingCard
                      key={b.id}
                      booking={b}
                      variant="past"
                      onAddOverage={() => setOverageBooking(b)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="mt-6">
              {cancelled.length === 0 ? (
                <Card className="flex flex-col items-center justify-center gap-2 border-dashed py-16 text-center">
                  <p className="text-sm font-medium">No cancelled sessions</p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {cancelled.map((b) => (
                    <MentorBookingCard key={b.id} booking={b} variant="cancelled" />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="pricing" className="mt-6">
              <PricingCard />
            </TabsContent>

            <TabsContent value="availability" className="mt-6">
              <AvailabilityCard />
            </TabsContent>

            <TabsContent value="verification" className="mt-6">
              <VerificationCard />
            </TabsContent>
          </Tabs>
        )}

        <AddOverageDialog
          booking={overageBooking}
          onClose={() => setOverageBooking(null)}
          onSubmit={handleAddOverage}
        />
      </div>
    </ProtectedRoute>
  );
}

function MentorBookingCard({
  booking,
  variant,
  onCancel,
  onMarkComplete,
  onAddOverage,
}: {
  booking: any;
  variant: "upcoming" | "past" | "cancelled";
  onCancel?: () => void;
  onMarkComplete?: () => void;
  onAddOverage?: () => void;
}) {
  const menteeName = booking.profiles?.full_name ?? "Unknown Mentee";
  const menteeAvatar = booking.profiles?.profile_picture_url;
  const meetingLink = Array.isArray(booking.meetings)
    ? booking.meetings[0]?.meeting_link
    : booking.meetings?.meeting_link;

  const initials = menteeName
    .split(" ")
    .map((n: string) => n[0])
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

  const hasPassed = new Date() > scheduledDate;

  return (
    <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
      {menteeAvatar ? (
        <img
          src={menteeAvatar}
          alt={menteeName}
          className="h-12 w-12 rounded-full border bg-muted object-cover"
        />
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">
          {initials}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">{menteeName}</p>
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
        </div>

        <p className="text-sm text-muted-foreground capitalize">
          {booking.session_type} Session
        </p>

        <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarClock className="h-3.5 w-3.5" /> {dateStr}
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
            Join Meeting
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
                Join
              </Button>
            )}
            {hasPassed && (
              <Button
                size="sm"
                variant="outline"
                onClick={onMarkComplete}
              >
                Mark Completed
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={onCancel}
            >
              Cancel
            </Button>
          </>
        )}
        {variant === "past" && (
          <Button
            size="sm"
            variant="outline"
            onClick={onAddOverage}
          >
            Add Extra Time
          </Button>
        )}
      </div>
    </Card>
  );
}

function AddOverageDialog({
  booking,
  onClose,
  onSubmit,
}: {
  booking: any | null;
  onClose: () => void;
  onSubmit: (
    bookingId: string,
    menteeId: string,
    extraMinutes: number,
    overageRate: number
  ) => void;
}) {
  const { user } = useAuth();
  const [extraMinutes, setExtraMinutes] = useState(0);
  const [overageRate, setOverageRate] = useState(0);
  const [loadingRate, setLoadingRate] = useState(true);

  useEffect(() => {
    if (booking) loadRate();
  }, [booking]);

  async function loadRate() {
    setLoadingRate(true);
    setExtraMinutes(0);

    const { data } = await supabase
      .from("mentor_profiles")
      .select("overage_price_per_minute")
      .eq("user_id", user!.id)
      .single();

    setOverageRate(data?.overage_price_per_minute ?? 0);
    setLoadingRate(false);
  }

  const menteeName = booking?.profiles?.full_name ?? "Mentee";
  const totalCharge = extraMinutes * overageRate;

  return (
    <Dialog open={!!booking} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Extra Session Time</DialogTitle>
        </DialogHeader>

        {booking && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <p className="font-semibold">{menteeName}</p>
              <p className="text-xs text-muted-foreground">
                {booking.session_type} session · {booking.duration_minutes}m booked
              </p>
            </div>

            {loadingRate ? (
              <p className="text-sm text-muted-foreground">Loading rate...</p>
            ) : overageRate === 0 ? (
              <p className="text-sm text-amber-600">
                You haven't set an overage rate yet. Set one in the
                Pricing tab before charging extra time.
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="text-xs">
                    Extra minutes the session ran over
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={extraMinutes}
                    onChange={(e) =>
                      setExtraMinutes(Math.max(0, Number(e.target.value) || 0))
                    }
                  />
                </div>

                <div className="rounded-lg border bg-muted/30 p-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {extraMinutes} min × PKR {overageRate}/min
                  </span>
                  <span className="font-bold text-gradient-primary">
                    PKR {totalCharge}
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={extraMinutes <= 0 || overageRate === 0}
            className="bg-gradient-primary text-primary-foreground hover:opacity-90"
            onClick={() =>
              onSubmit(
                booking.id,
                booking.mentee_id,
                extraMinutes,
                overageRate
              )
            }
          >
            Charge PKR {totalCharge}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PricingCard() {
  const { user } = useAuth();
  const [mentorProfileId, setMentorProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isFreeFirst, setIsFreeFirst] = useState(false);
  const [initialPrice, setInitialPrice] = useState(0);
  const [followupPrice, setFollowupPrice] = useState(0);
  const [overageRate, setOverageRate] = useState(0);

  useEffect(() => {
    if (user) loadPricing();
  }, [user]);

  async function loadPricing() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("mentor_profiles")
        .select("id, is_free_first_session, initial_session_price, followup_session_price, overage_price_per_minute")
        .eq("user_id", user!.id)
        .single();

      if (error || !data) {
        console.error("Failed to load pricing:", error);
        setLoading(false);
        return;
      }

      setMentorProfileId(data.id);
      setIsFreeFirst(data.is_free_first_session ?? false);
      setInitialPrice(data.initial_session_price ?? 0);
      setFollowupPrice(data.followup_session_price ?? 0);
      setOverageRate(data.overage_price_per_minute ?? 0);

    } catch (err) {
      console.error("Error loading pricing:", err);
    } finally {
      setLoading(false);
    }
  }

  async function savePricing() {
    if (!mentorProfileId) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("mentor_profiles")
        .update({
          is_free_first_session: isFreeFirst,
          initial_session_price: isFreeFirst ? 0 : initialPrice,
          followup_session_price: followupPrice,
          overage_price_per_minute: overageRate,
        })
        .eq("id", mentorProfileId);

      if (error) {
        toast.error("Failed to save pricing.");
        return;
      }

      toast.success("Pricing updated successfully.");

    } catch (err) {
      toast.error("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card className="p-6 flex items-center justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-2 flex items-center gap-2">
        <DollarSign className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Mentorship pricing</h2>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Set how much mentees pay for sessions with you. All prices in PKR.
      </p>

      {/* Free First Session Toggle */}
      <div className="mb-6 flex items-center justify-between rounded-lg border p-4">
        <div>
          <p className="text-sm font-medium">Free first session</p>
          <p className="text-xs text-muted-foreground">
            New mentees get their first session with you for free.
            This applies once per mentee.
          </p>
        </div>
        <Switch
          checked={isFreeFirst}
          onCheckedChange={setIsFreeFirst}
        />
      </div>

      <div className="space-y-6">

        {/* Initial Session Price */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Initial session price</Label>
            {isFreeFirst && (
              <span className="text-xs text-muted-foreground">
                Disabled — first session is free
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">PKR</span>
            <Input
              type="number"
              min={0}
              disabled={isFreeFirst}
              value={initialPrice}
              onChange={(e) =>
                setInitialPrice(Math.max(0, Number(e.target.value) || 0))
              }
              className="h-10"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Charged from a mentee's second session onward
            {isFreeFirst ? " (since first is free)" : ""}.
          </p>
        </div>

        <Separator />

        {/* Follow-up Session Price */}
        <div className="space-y-2">
          <Label>Follow-up session price</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">PKR</span>
            <Input
              type="number"
              min={0}
              value={followupPrice}
              onChange={(e) =>
                setFollowupPrice(Math.max(0, Number(e.target.value) || 0))
              }
              className="h-10"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            A discounted rate you may offer for repeat sessions.
          </p>
        </div>

        <Separator />

        {/* Overage Rate */}
        <div className="space-y-2">
          <Label>Overage rate (per extra minute)</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">PKR</span>
            <Input
              type="number"
              min={0}
              value={overageRate}
              onChange={(e) =>
                setOverageRate(Math.max(0, Number(e.target.value) || 0))
              }
              className="h-10"
            />
            <span className="text-sm text-muted-foreground">/ minute</span>
          </div>
          <p className="text-xs text-muted-foreground">
            If a session unexpectedly runs longer than planned, you can
            manually charge the mentee for the extra time at this rate
            from the session's details after it's marked complete.
          </p>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <Button
          disabled={saving}
          className="bg-gradient-primary text-primary-foreground hover:opacity-90"
          onClick={savePricing}
        >
          {saving ? "Saving..." : "Save pricing"}
        </Button> 
      </div>
    </Card>
  );
}

function PriceRow({
  label,
  description,
  value,
  onChange,
  max,
  currency,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (n: number) => void;
  max: number;
  currency: string;
}) {
  const symbol =
    currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "₨";
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">{symbol}</span>
          <Input
            type="number"
            min={0}
            max={max}
            value={value}
            onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
            className="h-9 w-24"
          />
        </div>
      </div>
      <Slider value={[value]} min={0} max={max} step={5} onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}

const WEEKDAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

interface TimeBlock {
  id: string; // temp id for new, real id for existing
  start_time: string; // "08:00"
  end_time: string;   // "10:30"
  isNew?: boolean;
}

function AvailabilityCard() {
  const { user } = useAuth();
  const [mentorProfileId, setMentorProfileId] = useState<string | null>(null);
  const [dayBlocks, setDayBlocks] = useState<Record<number, TimeBlock[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) loadAvailability();
  }, [user]);

  async function loadAvailability() {
    setLoading(true);
    try {
      const { data: mentorProfile } = await supabase
        .from("mentor_profiles")
        .select("id")
        .eq("user_id", user!.id)
        .single();

      if (!mentorProfile) {
        setLoading(false);
        return;
      }

      setMentorProfileId(mentorProfile.id);

      const { data, error } = await supabase
        .from("mentor_weekly_availability")
        .select("*")
        .eq("mentor_id", mentorProfile.id)
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Failed to load availability:", error);
        setLoading(false);
        return;
      }

      const grouped: Record<number, TimeBlock[]> = {};
      WEEKDAYS.forEach((d) => (grouped[d.value] = []));

      (data || []).forEach((row) => {
        grouped[row.day_of_week].push({
          id: row.id,
          start_time: row.start_time.slice(0, 5),
          end_time: row.end_time.slice(0, 5),
        });
      });

      setDayBlocks(grouped);
    } catch (err) {
      console.error("Error loading availability:", err);
    } finally {
      setLoading(false);
    }
  }

  function addBlock(day: number) {
    setDayBlocks((prev) => ({
      ...prev,
      [day]: [
        ...(prev[day] || []),
        {
          id: `new-${Date.now()}`,
          start_time: "09:00",
          end_time: "10:00",
          isNew: true,
        },
      ],
    }));
  }

  function updateBlock(day: number, blockId: string, patch: Partial<TimeBlock>) {
    setDayBlocks((prev) => ({
      ...prev,
      [day]: prev[day].map((b) => (b.id === blockId ? { ...b, ...patch } : b)),
    }));
  }

  function removeBlock(day: number, blockId: string) {
    setDayBlocks((prev) => ({
      ...prev,
      [day]: prev[day].filter((b) => b.id !== blockId),
    }));
  }

  async function saveAvailability() {
    if (!mentorProfileId) return;
    setSaving(true);

    try {
      // Validate all blocks first
      for (const day of WEEKDAYS) {
        const blocks = dayBlocks[day.value] || [];
        for (const b of blocks) {
          if (b.start_time >= b.end_time) {
            toast.error(
              `Invalid time block on ${day.label}: end time must be after start time.`
            );
            setSaving(false);
            return;
          }
        }
      }

      // Delete all existing rows for this mentor, then reinsert current state
      // Simplest reliable way to sync full weekly template
      const { error: deleteError } = await supabase
        .from("mentor_weekly_availability")
        .delete()
        .eq("mentor_id", mentorProfileId);

      if (deleteError) {
        toast.error("Failed to update availability.");
        setSaving(false);
        return;
      }

      const rowsToInsert: any[] = [];
      WEEKDAYS.forEach((day) => {
        const blocks = dayBlocks[day.value] || [];
        blocks.forEach((b) => {
          rowsToInsert.push({
            mentor_id: mentorProfileId,
            day_of_week: day.value,
            start_time: b.start_time,
            end_time: b.end_time,
            is_active: true,
          });
        });
      });

      if (rowsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("mentor_weekly_availability")
          .insert(rowsToInsert);

        if (insertError) {
          toast.error("Failed to save availability.");
          setSaving(false);
          return;
        }
      }

      toast.success(
        "Availability saved. You'll be notified once it's confirmed."
      );
      await loadAvailability();

    } catch (err) {
      toast.error("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card className="p-6 flex items-center justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-2 flex items-center gap-2">
        <CalendarDays className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Weekly availability</h2>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Set your recurring weekly schedule. This repeats every week
        until you change it. A day with no time blocks is fully disabled
        for booking.
      </p>

      <div className="space-y-4">
        {WEEKDAYS.map((day) => {
          const blocks = dayBlocks[day.value] || [];
          const isDisabled = blocks.length === 0;

          return (
            <div
              key={day.value}
              className="rounded-lg border p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{day.label}</p>
                  {isDisabled && (
                    <Badge variant="outline" className="text-[10px]">
                      Disabled
                    </Badge>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addBlock(day.value)}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add time block
                </Button>
              </div>

              {blocks.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No availability set. Mentees cannot book on this day.
                </p>
              ) : (
                <div className="space-y-2">
                  {blocks.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center gap-2 rounded-md border bg-muted/30 p-2"
                    >
                      <Input
                        type="time"
                        value={b.start_time}
                        onChange={(e) =>
                          updateBlock(day.value, b.id, {
                            start_time: e.target.value,
                          })
                        }
                        className="h-8 w-32"
                      />
                      <span className="text-xs text-muted-foreground">to</span>
                      <Input
                        type="time"
                        value={b.end_time}
                        onChange={(e) =>
                          updateBlock(day.value, b.id, {
                            end_time: e.target.value,
                          })
                        }
                        className="h-8 w-32"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBlock(day.value, b.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive ml-auto"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          disabled={saving}
          className="bg-gradient-primary text-primary-foreground hover:opacity-90"
          onClick={saveAvailability}
        >
          {saving ? "Saving..." : "Save availability"}
        </Button>
      </div>
    </Card>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gradient-primary">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </Card>
  );
}

type VerificationStatus = "unsubmitted" | "pending" | "verified" | "rejected";

function VerificationCard() {
  const { user } = useAuth();
  const storageKey = user?.email
    ? `guideme:mentor-verification:${user.email}`
    : "guideme:mentor-verification:anon";

  const [status, setStatus] = useState<VerificationStatus>("unsubmitted");
  const [qualification, setQualification] = useState("");
  const [years, setYears] = useState(1);
  const [institution, setInstitution] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [cvUrl, setCvUrl] = useState("");
  const [certificateUrl, setCertificateUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [language, setLanguage] = useState<"english" | "urdu" | "both">("english");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return;
    try {
      const v = JSON.parse(raw);
      setStatus(v.status ?? "pending");
      setQualification(v.qualification ?? "");
      setYears(v.years ?? 1);
      setInstitution(v.institution ?? "");
      setLinkedin(v.linkedin ?? "");
      setCvUrl(v.cvUrl ?? "");
      setCertificateUrl(v.certificateUrl ?? "");
      setPortfolioUrl(v.portfolioUrl ?? "");
      setLanguage(v.language ?? "english");
    } catch {
      // ignore
    }
  }, [storageKey]);

  const submit = () => {
    if (!qualification.trim() || !institution.trim()) {
      toast.error("Please fill in qualification and institution.");
      return;
    }
    const payload = {
      status: "verified" as const,
      qualification,
      years,
      institution,
      linkedin,
      cvUrl,
      certificateUrl,
      portfolioUrl,
      language,
    };
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
    setStatus("verified");
    toast.success("Verification submitted. You'll now appear as a Verified mentor.");
  };

  return (
    <Card className="p-6">
      <div className="mb-2 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Mentor verification</h2>
        {status === "verified" && (
          <Badge className="ml-2 gap-1 bg-gradient-primary text-primary-foreground">
            <BadgeCheck className="h-3 w-3" /> Verified
          </Badge>
        )}
        {status === "pending" && (
          <Badge variant="secondary" className="ml-2">Pending review</Badge>
        )}
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Submit your credentials to earn a Verified badge on your public profile. Mentees
        prefer booking verified mentors.
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Highest qualification *</Label>
          <Input
            placeholder="e.g. MS Computer Science"
            value={qualification}
            onChange={(e) => setQualification(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Years of experience</Label>
          <Input
            type="number"
            min={0}
            max={60}
            value={years}
            onChange={(e) => setYears(Math.max(0, Number(e.target.value) || 0))}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Institution name *</Label>
          <Input
            placeholder="e.g. University of the Punjab"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>LinkedIn URL</Label>
          <Input
            placeholder="https://linkedin.com/in/..."
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Portfolio URL</Label>
          <Input
            placeholder="https://..."
            value={portfolioUrl}
            onChange={(e) => setPortfolioUrl(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>CV link</Label>
          <Input
            placeholder="Link to your CV (PDF)"
            value={cvUrl}
            onChange={(e) => setCvUrl(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Certificate link</Label>
          <Input
            placeholder="Link to a relevant certificate"
            value={certificateUrl}
            onChange={(e) => setCertificateUrl(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Session language</Label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as "english" | "urdu" | "both")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="english">English</option>
            <option value="urdu">Urdu</option>
            <option value="both">Both</option>
          </select>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          * Required. Your Verified badge appears on your profile once submitted.
        </p>
        <Button
          className="bg-gradient-primary text-primary-foreground hover:opacity-90"
          onClick={submit}
        >
          {status === "verified" ? "Update verification" : "Submit for verification"}
        </Button>
      </div>
    </Card>
  );
}
