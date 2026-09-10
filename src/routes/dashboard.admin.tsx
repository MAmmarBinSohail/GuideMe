import { formatBookingDatePKT, formatTimePKT } from "@/lib/dateUtils";
import { createFileRoute, Link } from "@/lib/router-compat";
import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Users,
  BookOpen,
  Star,
  TrendingUp,
  Trash2,
  CheckCircle2,
  XCircle,
  Send,
  Loader2,
  BadgeCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export const Route = createFileRoute("/dashboard/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard — GuideMe" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}

function AdminDashboardContent() {
  const { user } = useAuth();

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMentors: 0,
    totalMentees: 0,
    totalBookings: 0,
    totalRevenue: 0,
    totalCommission: 0,
    totalMentorPayout: 0,
    totalReviews: 0,
    averageRating: 0,
    totalSubscribers: 0,
  });

  // Data
  const [mentors, setMentors] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);

  // Newsletter
  const [newsletterSubject, setNewsletterSubject] = useState("");
  const [newsletterBody, setNewsletterBody] = useState("");
  const [sendingNewsletter, setSendingNewsletter] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      await Promise.all([
        loadStats(),
        loadMentors(),
        loadUsers(),
        loadReviews(),
        loadSubscribers(),
        loadBookings(),
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    const [
      { count: totalUsers },
      { count: totalMentors },
      { count: totalMentees },
      { count: totalBookings },
      { count: totalReviews },
      { data: paymentsData },
      { data: reviewsData },
      { count: totalSubscribers },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "mentor"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "mentee"),
      supabase.from("bookings").select("*", { count: "exact", head: true }),
      supabase.from("reviews").select("*", { count: "exact", head: true }),
      supabase.from("payments").select("amount, platform_commission, mentor_payout").eq("payment_status", "completed"),
      supabase.from("reviews").select("rating"),
      supabase.from("subscribers").select("*", { count: "exact", head: true }).eq("is_active", true),
    ]);

    console.log("Payments data:", paymentsData);

    const totalRevenue = (paymentsData || []).reduce(
      (sum, p) => sum + Number(p.amount), 0
    );
    const totalCommission = (paymentsData || []).reduce(
      (sum, p) => sum + Number(p.platform_commission || 0), 0
    );
    const totalMentorPayout = (paymentsData || []).reduce(
      (sum, p) => sum + Number(p.mentor_payout || 0), 0
    );
    const avgRating = reviewsData && reviewsData.length > 0
      ? reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length
      : 0;

    setStats({
      totalUsers: totalUsers ?? 0,
      totalMentors: totalMentors ?? 0,
      totalMentees: totalMentees ?? 0,
      totalBookings: totalBookings ?? 0,
      totalRevenue,
      totalCommission,
      totalMentorPayout,
      totalReviews: totalReviews ?? 0,
      averageRating: avgRating,
      totalSubscribers: totalSubscribers ?? 0,
    });
  }

  async function loadMentors() {
    const { data } = await supabase
      .from("mentor_profiles")
      .select(`
        id,
        category,
        average_rating,
        is_available,
        is_hibernating,
        profiles (
          id,
          full_name,
          is_verified,
          profile_picture_url
        )
      `)
      .order("average_rating", { ascending: false });
    setMentors(data || []);
  }

  async function loadUsers() {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, role, is_verified, created_at")
      .neq("role", "admin")
      .order("created_at", { ascending: false });
    setUsers(data || []);
  }

  async function loadReviews() {
    const { data } = await supabase
      .from("reviews")
      .select(`
        id,
        rating,
        review_text,
        created_at,
        profiles!reviews_mentee_id_fkey (full_name),
        mentor_profiles (
          profiles (full_name)
        )
      `)
      .order("created_at", { ascending: false });
    setReviews(data || []);
  }

  async function loadSubscribers() {
    const { data } = await supabase
      .from("subscribers")
      .select("*")
      .eq("is_active", true)
      .order("subscribed_at", { ascending: false });
    setSubscribers(data || []);
  }

  async function loadBookings() {
    const { data } = await supabase
      .from("bookings")
      .select(`
        id,
        scheduled_at,
        duration_minutes,
        status,
        is_paid,
        profiles!bookings_mentee_id_fkey (full_name),
        mentor_profiles (
          profiles (full_name)
        )
      `)
      .order("scheduled_at", { ascending: false })
      .limit(50);
    setBookings(data || []);
  }

  async function toggleVerification(mentorProfileId: string, userId: string, currentStatus: boolean) {
    const { error } = await supabase
      .from("profiles")
      .update({ is_verified: !currentStatus })
      .eq("id", userId);

    if (error) {
      toast.error("Failed to update verification.");
      return;
    }

    toast.success(
      currentStatus ? "Mentor unverified." : "Mentor verified successfully."
    );
    await loadMentors();
  }

  async function deleteReview(reviewId: string, mentorId: string, mentorUserId: string) {
    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", reviewId);

    if (error) {
      toast.error("Failed to delete review.");
      return;
    }

    // Recalculate mentor average rating
    const { data: remaining } = await supabase
      .from("reviews")
      .select("rating")
      .eq("mentor_id", mentorId);

    const newAvg = remaining && remaining.length > 0
      ? remaining.reduce((s, r) => s + r.rating, 0) / remaining.length
      : 0;

    await supabase
      .from("mentor_profiles")
      .update({ average_rating: Math.round(newAvg * 10) / 10 })
      .eq("id", mentorId);

    toast.success("Review deleted.");
    await loadReviews();
  }

  async function sendNewsletter() {
    if (!newsletterSubject.trim() || !newsletterBody.trim()) {
      toast.error("Please fill in both subject and message.");
      return;
    }

    if (subscribers.length === 0) {
      toast.error("No active subscribers to send to.");
      return;
    }

    setSendingNewsletter(true);
    let successCount = 0;
    let failCount = 0;

    for (const sub of subscribers) {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({
              to: sub.email,
              subject: newsletterSubject,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 32px; border-radius: 12px 12px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">GuideMe</h1>
                  </div>
                  <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                    ${newsletterBody.replace(/\n/g, '<br/>')}
                    <p style="color: #9ca3af; font-size: 12px; margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
                      You are receiving this because you subscribed to GuideMe updates.
                      <a href="https://guideme-theta.vercel.app/unsubscribe?email=${sub.email}" 
                        style="color: #6b7280;">
                        Click here to unsubscribe
                      </a>
                    </p>
                  </div>
                </div>
              `
            }),
          }
        );

        if (response.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    setSendingNewsletter(false);
    setNewsletterSubject("");
    setNewsletterBody("");

    if (successCount > 0) {
      toast.success(`Newsletter sent to ${successCount} subscriber${successCount !== 1 ? 's' : ''}.${failCount > 0 ? ` ${failCount} failed.` : ''}`);
    } else {
      toast.error("Failed to send newsletter.");
    }
  }

  async function unsubscribe(subscriberId: string, email: string) {
    const { error } = await supabase
      .from("subscribers")
      .update({ is_active: false })
      .eq("id", subscriberId);

    if (error) {
      toast.error("Failed to unsubscribe.");
      return;
    }

    toast.success(`${email} unsubscribed.`);
    await loadSubscribers();
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Platform management for GuideMe
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { label: "Total Users", value: stats.totalUsers, icon: Users, sub: `${stats.totalMentors} mentors · ${stats.totalMentees} mentees` },
          { label: "Total Bookings", value: stats.totalBookings, icon: BookOpen, sub: "All time" },
          { label: "Total Revenue", value: `PKR ${stats.totalRevenue.toLocaleString()}`, icon: TrendingUp, sub: `Platform: PKR ${stats.totalCommission.toLocaleString()} · Mentors: PKR ${stats.totalMentorPayout.toLocaleString()}` },
          { label: "Avg Rating", value: stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "N/A", icon: Star, sub: `${stats.totalReviews} reviews total` },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {s.label}
              </p>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-gradient-primary">{s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="mentors">
        <TabsList className="flex-wrap h-auto mb-6">
          <TabsTrigger value="mentors">
            Mentors ({mentors.length})
          </TabsTrigger>
          <TabsTrigger value="users">
            Users ({users.length})
          </TabsTrigger>
          <TabsTrigger value="reviews">
            Reviews ({reviews.length})
          </TabsTrigger>
          <TabsTrigger value="newsletter">
            Newsletter ({subscribers.length} subscribers)
          </TabsTrigger>
          <TabsTrigger value="bookings">
            Bookings ({bookings.length})
          </TabsTrigger>
        </TabsList>

        {/* Mentors Tab */}
        <TabsContent value="mentors">
          <div className="space-y-3">
            {mentors.map((m) => {
              const name = m.profiles?.full_name ?? "Unknown";
              const isVerified = m.profiles?.is_verified ?? false;
              const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

              return (
                <Card key={m.id} className="p-4 flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{name}</p>
                      {isVerified && (
                        <BadgeCheck className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="secondary" className="text-[10px] capitalize">
                        {m.category}
                      </Badge>
                      {m.average_rating > 0 && (
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {Number(m.average_rating).toFixed(1)}
                        </span>
                      )}
                      {m.is_hibernating && (
                        <Badge variant="outline" className="text-[10px]">
                          Hibernating
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={isVerified ? "outline" : "default"}
                      className={isVerified ? "text-destructive border-destructive hover:bg-destructive/10" : "bg-gradient-primary text-primary-foreground"}
                      onClick={() => toggleVerification(m.id, m.profiles?.id, isVerified)}
                    >
                      {isVerified ? (
                        <><XCircle className="h-3.5 w-3.5 mr-1" /> Unverify</>
                      ) : (
                        <><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Verify</>
                      )}
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link to={`/mentors/${m.id}`}>View</Link>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <div className="space-y-3">
            {users.map((u) => {
              const initials = (u.full_name ?? "U")
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              return (
                <Card key={u.id} className="p-4 flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{u.full_name ?? "Unknown"}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge
                        variant="secondary"
                        className="text-[10px] capitalize"
                      >
                        {u.role}
                      </Badge>
                      {u.is_verified && (
                        <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        Joined {new Date(u.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews">
          <div className="space-y-3">
            {reviews.map((r) => {
              const menteeName = r.profiles?.full_name ?? "Unknown";
              const mentorName = (r.mentor_profiles as any)?.profiles?.full_name ?? "Unknown";

              return (
                <Card key={r.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold">{menteeName}</span>
                        <span className="text-xs text-muted-foreground">→</span>
                        <span className="text-sm text-muted-foreground">{mentorName}</span>
                      </div>
                      <div className="flex items-center gap-1 mb-1">
                        {[1,2,3,4,5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3.5 w-3.5 ${star <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      {r.review_text && (
                        <p className="text-xs text-muted-foreground">{r.review_text}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(r.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => deleteReview(r.id, r.mentor_id, (r.mentor_profiles as any)?.profiles?.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings">
          <div className="space-y-3">
            {bookings.map((b) => {
              const menteeName = (b.profiles as any)?.full_name ?? "Unknown";
              const mentorName = (b.mentor_profiles as any)?.profiles?.full_name ?? "Unknown";
              const date = formatBookingDatePKT(b.scheduled_at);
              const time = formatTimePKT(b.scheduled_at);

              return (
                <Card key={b.id} className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold">{menteeName}</p>
                      <span className="text-xs text-muted-foreground">with</span>
                      <p className="text-sm text-muted-foreground">{mentorName}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{date} at {time}</span>
                      <span>{b.duration_minutes}min</span>
                      <span>{b.is_paid ? "Paid" : "Free"}</span>
                    </div>
                  </div>
                  <Badge
                    variant={
                      b.status === "confirmed" ? "default" :
                      b.status === "completed" ? "secondary" :
                      "destructive"
                    }
                    className="capitalize shrink-0"
                  >
                    {b.status}
                  </Badge>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Newsletter Tab */}
        <TabsContent value="newsletter">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Compose Newsletter */}
            <Card className="p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Send className="h-4 w-4 text-primary" />
                Send Newsletter
              </h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Subject</Label>
                  <Input
                    placeholder="e.g. New mentors available this week!"
                    value={newsletterSubject}
                    onChange={(e) => setNewsletterSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Message</Label>
                  <Textarea
                    placeholder="Write your newsletter content here..."
                    value={newsletterBody}
                    onChange={(e) => setNewsletterBody(e.target.value)}
                    rows={8}
                  />
                </div>
                <Button
                  disabled={sendingNewsletter}
                  onClick={sendNewsletter}
                  className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90"
                >
                  {sendingNewsletter ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>
                  ) : (
                    <><Send className="mr-2 h-4 w-4" />Send to {subscribers.length} subscribers</>
                  )}
                </Button>
              </div>
            </Card>

            {/* Subscribers List */}
            <Card className="p-5">
              <h3 className="font-semibold mb-4">
                Subscribers ({subscribers.length})
              </h3>
              {subscribers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No subscribers yet.</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {subscribers.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-lg border p-2 text-sm"
                    >
                      <span className="text-muted-foreground truncate">{s.email}</span>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(s.subscribed_at).toLocaleDateString()}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => unsubscribe(s.id, s.email)}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}