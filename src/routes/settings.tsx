import { supabase } from "@/supabaseClient";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { createFileRoute, Link } from "@/lib/router-compat";
import { useRef, useState, useEffect } from "react";
import { User, Lock, Bell, Palette, Eye, Moon, Sun, PauseCircle, Camera } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  const isMentor = user?.role === "mentor";

  return (
    <ProtectedRoute>
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
    </ProtectedRoute>
  );
}

function ProfileCard() {
  const { user, updateAvatar } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user?.id)
        .single();

      if (data) {
        setFullName(data.full_name ?? "");
        setPhone(data.phone ?? "");
      }
    }
    if (user) loadProfile();
  }, [user]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const filePath = `${user?.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        toast.error("Failed to upload image.");
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Add cache busting timestamp to force browser to reload image
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Save URL to profiles table
      await supabase
        .from("profiles")
        .update({ profile_picture_url: publicUrl })
        .eq("id", user?.id);

      // Update local auth context immediately — navbar updates right away
      updateAvatar(publicUrl);

      toast.success("Profile picture updated.");

    } catch (err) {
      toast.error("Something went wrong.");
    }
  };

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone: phone,
      })
      .eq("id", user?.id);

    if (error) {
      toast.error("Failed to update profile.");
    } else {
      toast.success("Profile updated successfully.");
    }
    setSaving(false);
  }

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
            PNG, JPG up to 5MB.
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
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            type="email"
            defaultValue={user?.email ?? ""}
            disabled
          />
        </div>
        <div className="space-y-2">
          <Label>Role</Label>
          <Input
            defaultValue={user?.role ?? ""}
            disabled
            className="capitalize"
          />
        </div>
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+92 300 1234567"
          />
        </div>
      </div>
      <div className="mt-5 flex justify-end">
        <Button
          disabled={saving}
          className="bg-gradient-primary text-primary-foreground hover:opacity-90"
          onClick={handleSave}
        >
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </Card>
  );
}

function ChangePasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (next.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }

    if (next !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      // Step 1 - Verify current password by signing in
      const { data: { user } } = await supabase.auth.getUser();

      if (!user?.email) {
        toast.error("Could not verify your identity.");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: current,
      });

      if (signInError) {
        toast.error("Current password is incorrect.");
        return;
      }

      // Step 2 - Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: next,
      });

      if (updateError) {
        toast.error(updateError.message);
        return;
      }

      toast.success("Password changed successfully.");
      setCurrent("");
      setNext("");
      setConfirm("");

    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    }
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
  const { user } = useAuth();
  const [mentorProfileId, setMentorProfileId] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [duration, setDuration] = useState("7");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadHibernation();
  }, [user]);

  async function loadHibernation() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("mentor_profiles")
        .select("id, is_hibernating, hibernate_until")
        .eq("user_id", user!.id)
        .single();

      if (data) {
        setMentorProfileId(data.id);

        // Check if still hibernating
        if (data.is_hibernating && data.hibernate_until) {
          const hibernateUntil = new Date(data.hibernate_until);
          if (hibernateUntil > new Date()) {
            setEnabled(true);
          } else {
            // Auto-disable if duration has passed
            await supabase
              .from("mentor_profiles")
              .update({ is_hibernating: false, hibernate_until: null })
              .eq("id", data.id);
            setEnabled(false);
          }
        } else {
          setEnabled(data.is_hibernating ?? false);
        }
      }
    } catch (err) {
      console.error("Error loading hibernation:", err);
    } finally {
      setLoading(false);
    }
  }

  async function saveHibernation() {
    if (!mentorProfileId) return;
    setSaving(true);

    try {
      const hibernateUntil = enabled
        ? new Date(
            Date.now() + parseInt(duration) * 24 * 60 * 60 * 1000
          )
            .toISOString()
            .split("T")[0]
        : null;

      const { error } = await supabase
        .from("mentor_profiles")
        .update({
          is_hibernating: enabled,
          hibernate_until: hibernateUntil,
        })
        .eq("id", mentorProfileId);

      if (error) {
        toast.error("Failed to save hibernation settings.");
        return;
      }

      toast.success(
        enabled
          ? `Hibernation activated for ${duration} day(s). New bookings are paused.`
          : "Hibernation disabled. You are now accepting bookings."
      );
    } catch (err) {
      toast.error("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card className="p-6 flex items-center justify-center py-10">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <PauseCircle className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Hibernation mode</h2>
        {enabled && (
          <Badge variant="secondary" className="ml-2">Active</Badge>
        )}
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        Temporarily pause your mentor profile. New mentees won't be
        able to book during this period, but already-booked sessions
        will still take place.
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
          </>
        )}
      </div>
      <div className="mt-5 flex justify-end">
        <Button
          disabled={saving}
          className="bg-gradient-primary text-primary-foreground hover:opacity-90"
          onClick={saveHibernation}
        >
          {saving ? "Saving..." : "Save hibernation"}
        </Button>
      </div>
    </Card>
  );
} 

function NotificationPreferencesCard() {
  const { user } = useAuth();
  const [email, setEmail] = useState(true);
  const [booking, setBooking] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadPrefs() {
      const { data } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (data) {
        setEmail(data.email_notifications ?? true);
        setBooking(data.booking_alerts ?? true);
        setReminders(data.reminder_alerts ?? true);
      }
    }
    if (user) loadPrefs();
  }, [user]);

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase
      .from("notification_preferences")
      .update({
        email_notifications: email,
        booking_alerts: booking,
        reminder_alerts: reminders,
      })
      .eq("user_id", user?.id);

    if (error) {
      toast.error("Failed to save preferences.");
    } else {
      toast.success("Preferences saved.");
    }
    setSaving(false);
  }

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
          disabled={saving}
          className="bg-gradient-primary text-primary-foreground hover:opacity-90"
          onClick={handleSave}
        >
          {saving ? "Saving..." : "Save preferences"}
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
