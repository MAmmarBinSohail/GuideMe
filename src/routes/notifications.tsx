import { ProtectedRoute } from "@/components/ProtectedRoute";
import { createFileRoute } from "@/lib/router-compat";
import { useEffect, useState } from "react";
import { Bell, Calendar, Check, Loader2, Star, Trash2, User, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/supabaseClient";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  related_booking_id: string | null;
}

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — GuideMe" }] }),
  component: NotificationsPage,
});

function getTypeIcon(type: string) {
  switch (type) {
    case "booking_confirmed":
      return <Calendar className="h-4 w-4" />;
    case "session_reminder":
      return <Bell className="h-4 w-4" />;
    case "booking_cancelled":
      return <XCircle className="h-4 w-4" />;
    case "reschedule":
      return <Calendar className="h-4 w-4" />;
    case "meeting_link":
      return <Bell className="h-4 w-4" />;
    case "payment":
      return <Star className="h-4 w-4" />;
    default:
      return <User className="h-4 w-4" />;
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case "booking_confirmed":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "session_reminder":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    case "booking_cancelled":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    case "reschedule":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "meeting_link":
      return "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400";
    case "payment":
      return "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
  }
}

function timeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  async function fetchNotifications() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to fetch notifications:", error);
      } else {
        setNotifications(data || []);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  }

  async function markAllAsRead() {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user!.id);

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true }))
    );

    toast.success("All notifications marked as read.");
  }

  async function deleteNotification(id: string) {
    const { error } = await supabase.from("notifications").delete().eq("id", id);

    if (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete notification.");
      return;
    }

    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast.success("Notification deleted.");
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const unread = notifications.filter((n) => !n.is_read);

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-10">

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Notifications
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Stay updated on your sessions and reminders.
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <Check className="mr-1.5 h-3.5 w-3.5" />
              Mark all as read
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">
                All{" "}
                <Badge variant="secondary" className="ml-1.5 text-[10px]">
                  {notifications.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="unread">
                Unread{" "}
                {unreadCount > 0 && (
                  <Badge className="ml-1.5 bg-gradient-primary text-primary-foreground text-[10px]">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <NotificationList
                items={notifications}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
                emptyText="No notifications yet."
              />
            </TabsContent>

            <TabsContent value="unread" className="mt-6">
              <NotificationList
                items={unread}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
                emptyText="No unread notifications."
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </ProtectedRoute>
  );
}

function NotificationList({
  items,
  onMarkAsRead,
  onDelete,
  emptyText,
}: {
  items: Notification[];
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  emptyText: string;
}) {
  if (items.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center gap-2 border-dashed py-16 text-center">
        <Bell className="h-7 w-7 text-muted-foreground" />
        <p className="text-sm font-medium text-muted-foreground">
          {emptyText}
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {items.map((n) => (
        <Card
          key={n.id}
          className={`flex items-start gap-4 p-4 transition-all cursor-pointer ${
            n.is_read ? "opacity-70" : "border-primary/30 bg-primary/5 opacity-100"
          }`}
          onClick={() => !n.is_read && onMarkAsRead(n.id)}
        > 
          <div
            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${getTypeColor(n.type)}`}
          >
            {getTypeIcon(n.type)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">{n.title}</p>
              {!n.is_read && (
                <span className="h-2 w-2 rounded-full bg-primary" />
              )}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {n.message}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {timeAgo(n.created_at)}
            </p>
          </div>

          <div className="flex items-center gap-1">
            {!n.is_read && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead(n.id);
                }}
                title="Mark as read"
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(n.id);
              }}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}