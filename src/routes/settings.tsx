import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  User,
  Lock,
  Bell,
  Palette,
  Eye,
  Moon,
  Sun,
  PauseCircle,
  Camera,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — GuideMe" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) navigate({ to: "/login" });
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;
  const isMentor = user?.role === "mentor";

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile, password, theme, privacy, and notifications.
        </p>
      </div>

      <div className="space-y-6">
        <ProfileCard />
        <ChangePasswordCard />
        <ThemeCard />
        {isMentor ? <HibernationCard /> : <PrivacyCard />}
        <NotificationPreferencesCard />
      </div>
    </div>
  );
}

function ProfileCard() {
  const { user, updateAvatar } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateAvatar(reader.result as string);
      toast.success("Profile picture updated.");
    };
    reader.readAsDataURL(file);
  };

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <User className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Profile</h2>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="relative">
          <Avatar className="h-20 w-20 border-2 border-border">
            {user?.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
            <AvatarFallback className="bg-gradient-primary text-2xl text-primary-foreground">
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Change profile picture"
            className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-elegant transition hover:opacity-90"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <div>
          <p className="text-sm font-medium">Profile picture</p>
          <p className="text-xs text-muted-foreground">
            PNG, JPG up to 5MB. Click the camera icon to upload.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="mr-1.5 h-3.5 w-3.5" /> Upload new
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Full name</Label>
          <Input defaultValue={user?.name ?? ""} />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" defaultValue={user?.email ?? ""} disabled />
        </div>
        <div className="space-y-2">
          <Label>Role</Label>
          <Input defaultValue={user?.role ?? ""} disabled className="capitalize" />
        </div>
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input placeholder="+92 300 1234567" />
        </div>
      </div>
      <div className="mt-5 flex justify-end">
        <Button
          className="bg-gradient-primary text-primary-foreground hover:opacity-90"
          onClick={() => toast.success("Profile updated.")}
        >
          Save changes
        </Button>
      </div>
    </Card>
  );
}

function ChangePasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    toast.success("Password changed successfully.");
    setCurrent("");
    setNext("");
    setConfirm("");
  };

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <Lock className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Change password</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="current">Current password</Label>
          <Input
            id="current"
            type="password"
            required
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </div>
        <Separator />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="new">New password</Label>
            <Input
              id="new"
              type="password"
              required
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm new password</Label>
            <Input
              id="confirm"
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center justify-between pt-2">
          <Link
            to="/forgot-password"
            className="text-xs font-medium text-primary hover:underline"
          >
            Forgot current password?
          </Link>
          <Button
            type="submit"
            className="bg-gradient-primary text-primary-foreground hover:opacity-90"
          >
            Update password
          </Button>
        </div>
      </form>
    </Card>
  );
}

function ThemeCard() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <Palette className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Theme</h2>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Appearance</p>
          <p className="text-xs text-muted-foreground">
            Switch between light and dark mode. Currently using{" "}
            <span className="font-medium capitalize">{theme}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Sun className="h-4 w-4 text-muted-foreground" />
          <Switch checked={isDark} onCheckedChange={toggleTheme} />
          <Moon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </Card>
  );
}

function PrivacyCard() {
  // Mentee-only privacy. Default: visible only to mentors they've booked.
  const [visibility, setVisibility] = useState<"private" | "mentors" | "public">("mentors");

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <Eye className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Profile privacy</h2>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        Choose who can see your mentee profile.
      </p>
      <div className="space-y-3">
        <PrivacyOption
          id="mentors"
          title="Booked mentors only"
          desc="Default. Only mentors you've already booked can view your profile."
          checked={visibility === "mentors"}
          onSelect={() => setVisibility("mentors")}
        />
        <PrivacyOption
          id="public"
          title="All mentors"
          desc="Any mentor on GuideMe can view your profile."
          checked={visibility === "public"}
          onSelect={() => setVisibility("public")}
        />
        <PrivacyOption
          id="private"
          title="Private"
          desc="Nobody can view your profile. Booked mentors will see a placeholder."
          checked={visibility === "private"}
          onSelect={() => setVisibility("private")}
        />
      </div>
      <div className="mt-5 flex justify-end">
        <Button
          className="bg-gradient-primary text-primary-foreground hover:opacity-90"
          onClick={() => toast.success("Privacy preference saved.")}
        >
          Save privacy
        </Button>
      </div>
    </Card>
  );
}

function PrivacyOption({
  id,
  title,
  desc,
  checked,
  onSelect,
}: {
  id: string;
  title: string;
  desc: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition ${
        checked ? "border-primary bg-primary/5" : "hover:border-primary/50"
      }`}
    >
      <span
        className={`mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
          checked ? "border-primary" : "border-muted-foreground/50"
        }`}
      >
        {checked && <span className="h-2 w-2 rounded-full bg-primary" />}
      </span>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <span className="sr-only">{id}</span>
    </button>
  );
}

function HibernationCard() {
  const [enabled, setEnabled] = useState(false);
  const [duration, setDuration] = useState("7");
  const [allowFollowups, setAllowFollowups] = useState(true);

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <PauseCircle className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Hibernation mode</h2>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        Temporarily pause your mentor profile. New mentees won't be able to book during this
        period, but already-booked sessions will still take place.
      </p>
      <div className="space-y-4">
        <ToggleRow
          label="Enable hibernation"
          description="Pause new bookings on your profile."
          checked={enabled}
          onCheckedChange={setEnabled}
        />
        {enabled && (
          <>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Pause duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="7">1 week</SelectItem>
                    <SelectItem value="14">2 weeks</SelectItem>
                    <SelectItem value="30">1 month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Separator />
            <ToggleRow
              label="Allow follow-up sessions"
              description="Let me schedule follow-ups with existing mentees during hibernation."
              checked={allowFollowups}
              onCheckedChange={setAllowFollowups}
            />
          </>
        )}
      </div>
      <div className="mt-5 flex justify-end">
        <Button
          className="bg-gradient-primary text-primary-foreground hover:opacity-90"
          onClick={() =>
            toast.success(
              enabled
                ? `Hibernation activated for ${duration} day(s).`
                : "Hibernation disabled.",
            )
          }
        >
          Save hibernation
        </Button>
      </div>
    </Card>
  );
}

function NotificationPreferencesCard() {
  const [email, setEmail] = useState(true);
  const [booking, setBooking] = useState(true);
  const [reminders, setReminders] = useState(true);

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <Bell className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Notification preferences</h2>
      </div>
      <div className="space-y-4">
        <ToggleRow
          label="Email notifications"
          description="Get important updates via email."
          checked={email}
          onCheckedChange={setEmail}
        />
        <Separator />
        <ToggleRow
          label="Booking alerts"
          description="Confirmations, cancellations, and reschedules."
          checked={booking}
          onCheckedChange={setBooking}
        />
        <Separator />
        <ToggleRow
          label="Session reminders"
          description="Reminders before your upcoming sessions."
          checked={reminders}
          onCheckedChange={setReminders}
        />
      </div>
      <div className="mt-5 flex justify-end">
        <Button
          className="bg-gradient-primary text-primary-foreground hover:opacity-90"
          onClick={() => toast.success("Preferences saved.")}
        >
          Save preferences
        </Button>
      </div>
    </Card>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
