import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
import {
  MOCK_MENTOR_SCHEDULE,
  MOCK_MENTOR_REQUESTS,
  type Session,
} from "@/lib/mock-data";
import { MENTEE_NAME_TO_ID, getMentee } from "@/lib/mentees-data";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/dashboard/mentor")({
  head: () => ({ meta: [{ title: "Mentor Dashboard — GuideMe" }] }),
  component: MentorDashboard,
});

type RequestStatus = "pending" | "accepted" | "declined";

function MentorDashboard() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!isAuthenticated) navigate({ to: "/login" });
  }, [isAuthenticated, navigate]);

  const [schedule, setSchedule] = useState<Session[]>(MOCK_MENTOR_SCHEDULE);
  const [requests, setRequests] = useState<Session[]>(MOCK_MENTOR_REQUESTS);
  const [requestStatus, setRequestStatus] = useState<Record<string, RequestStatus>>(
    Object.fromEntries(MOCK_MENTOR_REQUESTS.map((r) => [r.id, "pending"])),
  );
  const [rescheduling, setRescheduling] = useState<Session | null>(null);

  if (!isAuthenticated) return null;

  const earningsThisMonth = schedule.reduce((sum, s) => sum + s.price, 0) + 320;
  const pendingCount = requests.filter((r) => requestStatus[r.id] === "pending").length;

  const handleAccept = (s: Session) => {
    setRequestStatus((m) => ({ ...m, [s.id]: "accepted" }));
    // Move into schedule
    setSchedule((list) => [...list, { ...s, status: "upcoming" }]);
    toast.success(`Accepted ${s.menteeName}'s request — added to your schedule.`);
  };

  const handleDecline = (s: Session) => {
    setRequestStatus((m) => ({ ...m, [s.id]: "declined" }));
    toast.info(`Declined ${s.menteeName}'s request.`);
  };

  const handleReschedule = (updated: { date: string; time: string; durationMinutes: number }) => {
    if (!rescheduling) return;
    setSchedule((list) =>
      list.map((s) => (s.id === rescheduling.id ? { ...s, ...updated } : s)),
    );
    toast.success("Session rescheduled. Mentee has been notified.");
    setRescheduling(null);
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Mentor Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your schedule, requests, and earnings.
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="This week" value={String(schedule.length)} sub="scheduled sessions" />
        <StatCard
          label="Pending requests"
          value={String(pendingCount)}
          sub="awaiting your reply"
        />
        <StatCard label="Earnings" value={`$${earningsThisMonth}`} sub="this month" />
      </div>

      <Tabs defaultValue="schedule">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="schedule">Schedule ({schedule.length})</TabsTrigger>
          <TabsTrigger value="requests">Requests ({requests.length})</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="mt-6">
          <div className="grid gap-4">
            {schedule.map((s) => (
              <ScheduleCard
                key={s.id}
                session={s}
                onReschedule={() => setRescheduling(s)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          <div className="grid gap-4">
            {requests.map((s) => (
              <RequestCard
                key={s.id}
                session={s}
                status={requestStatus[s.id] ?? "pending"}
                onAccept={() => handleAccept(s)}
                onDecline={() => handleDecline(s)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="earnings" className="mt-6">
          <Card className="p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Total earned (last 30 days)
            </p>
            <p className="mt-2 text-4xl font-bold text-gradient-primary">
              ${earningsThisMonth}
            </p>
            <div className="mt-6 space-y-3 border-t pt-4">
              {schedule.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{s.topic}</p>
                    <p className="text-xs text-muted-foreground">
                      with {s.menteeName} · {s.date}
                    </p>
                  </div>
                  <p className="font-semibold">+${s.price}</p>
                </div>
              ))}
            </div>
          </Card>
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

      <RescheduleDialog
        session={rescheduling}
        onClose={() => setRescheduling(null)}
        onSave={handleReschedule}
      />
    </div>
  );
}

function PricingCard() {
  const [hourlyRate, setHourlyRate] = useState(75);
  const [thirtyMinRate, setThirtyMinRate] = useState(40);
  const [packageRate, setPackageRate] = useState(280);
  const [currency, setCurrency] = useState("USD");

  return (
    <Card className="p-6">
      <div className="mb-2 flex items-center gap-2">
        <DollarSign className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Mentorship pricing</h2>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Set the price mentees pay for your time. Adjust the slider or type a value.
      </p>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Currency</Label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="PKR">PKR (₨)</option>
          </select>
        </div>
      </div>

      <div className="space-y-8">
        <PriceRow
          label="60-minute session"
          description="Standard mentorship hour."
          value={hourlyRate}
          onChange={setHourlyRate}
          max={500}
          currency={currency}
        />
        <PriceRow
          label="30-minute session"
          description="Quick consult or follow-up."
          value={thirtyMinRate}
          onChange={setThirtyMinRate}
          max={300}
          currency={currency}
        />
        <PriceRow
          label="4-session package"
          description="Discounted bundle for committed mentees."
          value={packageRate}
          onChange={setPackageRate}
          max={2000}
          currency={currency}
        />
      </div>

      <div className="mt-8 flex justify-end">
        <Button
          className="bg-gradient-primary text-primary-foreground hover:opacity-90"
          onClick={() => toast.success("Pricing updated.")}
        >
          Save pricing
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
      <Slider
        value={[value]}
        min={0}
        max={max}
        step={5}
        onValueChange={(v) => onChange(v[0])}
      />
    </div>
  );
}

interface AvailabilityWindow {
  id: string;
  day: string; // weekday name
  enabled: boolean;
  startTime: string; // HH:mm
  durationMinutes: number; // 30..1440
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function defaultAvailability(): AvailabilityWindow[] {
  return WEEKDAYS.map((d, i) => ({
    id: `${d}-${i}`,
    day: d,
    enabled: d !== "Sat" && d !== "Sun",
    startTime: "10:00",
    durationMinutes: 60,
  }));
}

function formatDuration(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

function AvailabilityCard() {
  const [windows, setWindows] = useState<AvailabilityWindow[]>(defaultAvailability());

  const update = (id: string, patch: Partial<AvailabilityWindow>) =>
    setWindows((list) => list.map((w) => (w.id === id ? { ...w, ...patch } : w)));

  const add = () =>
    setWindows((list) => [
      ...list,
      {
        id: `slot-${Date.now()}`,
        day: "Mon",
        enabled: true,
        startTime: "14:00",
        durationMinutes: 60,
      },
    ]);

  const remove = (id: string) =>
    setWindows((list) => list.filter((w) => w.id !== id));

  return (
    <Card className="p-6">
      <div className="mb-2 flex items-center gap-2">
        <CalendarDays className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Weekly availability</h2>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Choose the days and times you're open for mentorship. Sessions can be anywhere from
        30 minutes to 24 hours long.
      </p>

      <div className="space-y-3">
        {windows.map((w) => (
          <div
            key={w.id}
            className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[auto_1fr_1fr_auto] sm:items-center"
          >
            <div className="flex items-center gap-3">
              <Switch
                checked={w.enabled}
                onCheckedChange={(v) => update(w.id, { enabled: v })}
              />
              <select
                value={w.day}
                onChange={(e) => update(w.id, { day: e.target.value })}
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              >
                {WEEKDAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Start time</Label>
              <Input
                type="time"
                value={w.startTime}
                disabled={!w.enabled}
                onChange={(e) => update(w.id, { startTime: e.target.value })}
                className="h-9"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Duration</Label>
                <span className="text-xs font-medium">{formatDuration(w.durationMinutes)}</span>
              </div>
              <Slider
                value={[w.durationMinutes]}
                min={30}
                max={1440}
                step={15}
                disabled={!w.enabled}
                onValueChange={(v) => update(w.id, { durationMinutes: v[0] })}
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => remove(w.id)}
              aria-label="Remove window"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-between gap-2">
        <Button variant="outline" onClick={add}>
          <Plus className="mr-1 h-4 w-4" /> Add window
        </Button>
        <Button
          className="bg-gradient-primary text-primary-foreground hover:opacity-90"
          onClick={() => toast.success("Availability saved.")}
        >
          Save availability
        </Button>
      </div>
    </Card>
  );
}

function RescheduleDialog({
  session,
  onClose,
  onSave,
}: {
  session: Session | null;
  onClose: () => void;
  onSave: (v: { date: string; time: string; durationMinutes: number }) => void;
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(60);

  useEffect(() => {
    if (session) {
      setDate("");
      setTime("");
      setDuration(session.durationMinutes);
    }
  }, [session]);

  return (
    <Dialog open={!!session} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reschedule session</DialogTitle>
        </DialogHeader>
        {session && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <p className="font-semibold">{session.menteeName}</p>
              <p className="text-xs text-muted-foreground">{session.topic}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Current: {session.date} · {session.time} · {session.durationMinutes}m
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">New date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">New time</Label>
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Duration</Label>
                <span className="text-xs font-medium">{formatDuration(duration)}</span>
              </div>
              <Slider
                value={[duration]}
                min={30}
                max={1440}
                step={15}
                onValueChange={(v) => setDuration(v[0])}
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!date || !time}
            className="bg-gradient-primary text-primary-foreground hover:opacity-90"
            onClick={() => {
              const d = new Date(date + "T00:00:00");
              const formatted = d.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              onSave({ date: formatted, time, durationMinutes: duration });
            }}
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ScheduleCard({
  session,
  onReschedule,
}: {
  session: Session;
  onReschedule: () => void;
}) {
  const menteeId = session.menteeName ? MENTEE_NAME_TO_ID[session.menteeName] : undefined;
  const mentee = menteeId ? getMentee(menteeId) : undefined;
  const canView = !!mentee;
  return (
    <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
      <img
        src={session.menteeAvatar}
        alt={session.menteeName}
        className="h-12 w-12 rounded-full border bg-muted"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold">{session.menteeName}</p>
          <Badge className="bg-gradient-primary text-primary-foreground">Confirmed</Badge>
          {mentee && !mentee.isPublic && (
            <Badge variant="outline" className="gap-1 text-[10px]">
              <Lock className="h-2.5 w-2.5" /> Private
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{session.topic}</p>
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarClock className="h-3.5 w-3.5" /> {session.date}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {session.time} · {session.durationMinutes}m
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {canView ? (
          <Button size="sm" variant="outline" asChild>
            <Link to="/mentees/$id" params={{ id: menteeId! }}>
              <User className="mr-1 h-3.5 w-3.5" /> View Profile
            </Link>
          </Button>
        ) : (
          <Button size="sm" variant="outline" disabled title="Profile unavailable">
            <Lock className="mr-1 h-3.5 w-3.5" /> View Profile
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={onReschedule}>
          <CalendarClock className="mr-1 h-3.5 w-3.5" /> Reschedule
        </Button>
      </div>
    </Card>
  );
}

function RequestCard({
  session,
  status,
  onAccept,
  onDecline,
}: {
  session: Session;
  status: RequestStatus;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
      <img
        src={session.menteeAvatar}
        alt={session.menteeName}
        className="h-12 w-12 rounded-full border bg-muted"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">{session.menteeName}</p>
          {status === "pending" && (
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" /> Pending
            </Badge>
          )}
          {status === "accepted" && (
            <Badge className="gap-1 bg-green-600 text-white hover:bg-green-600">
              <Check className="h-3 w-3" /> Accepted
            </Badge>
          )}
          {status === "declined" && (
            <Badge variant="outline" className="gap-1 border-destructive text-destructive">
              <X className="h-3 w-3" /> Declined
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{session.topic}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Requested: {session.date} · {session.time} · {session.durationMinutes}m · ${session.price}
        </p>
      </div>
      <div className="flex gap-2">
        {status === "pending" ? (
          <>
            <Button size="sm" variant="outline" onClick={onDecline}>
              <X className="mr-1 h-3.5 w-3.5" /> Decline
            </Button>
            <Button
              size="sm"
              className="bg-gradient-primary text-primary-foreground hover:opacity-90"
              onClick={onAccept}
            >
              <Check className="mr-1 h-3.5 w-3.5" /> Accept
            </Button>
          </>
        ) : (
          <Button size="sm" variant="outline" disabled>
            {status === "accepted" ? "Accepted" : "Declined"}
          </Button>
        )}
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
