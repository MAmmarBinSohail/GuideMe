import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Bell,
  Calendar,
  Check,
  MessageSquare,
  Star,
  Trash2,
  User,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";

export interface Notification {
  id: string;
  type: "booking" | "reminder" | "message" | "review" | "system";
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  link?: string;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    type: "booking",
    title: "Session confirmed",
    body: "Your session with Ayesha Khan on Jun 5 at 4:00 PM has been confirmed.",
    timestamp: "2 hours ago",
    read: false,
    link: "/dashboard/mentee",
  },
  {
    id: "n2",
    type: "reminder",
    title: "Upcoming session",
    body: "You have a session with Daniyal Ahmed tomorrow at 7:30 PM.",
    timestamp: "5 hours ago",
    read: false,
    link: "/dashboard/mentee",
  },
  {
    id: "n3",
    type: "message",
    title: "New message",
    body: "Omar Siddiqui sent you a message about your upcoming session.",
    timestamp: "1 day ago",
    read: true,
  },
  {
    id: "n4",
    type: "review",
    title: "Leave a review",
    body: "Your session with Bilal Tariq is complete. Please leave a review.",
    timestamp: "2 days ago",
    read: true,
    link: "/dashboard/mentee",
  },
  {
    id: "n5",
    type: "system",
    title: "Welcome to GuideMe",
    body: "Complete your profile to get better mentor recommendations.",
    timestamp: "1 week ago",
    read: true,
    link: "/settings",
  },
];

const typeIcon = (type: Notification["type"]) => {
  switch (type) {
    case "booking":
      return <Calendar className="h-4 w-4" />;
    case "reminder":
      return <Bell className="h-4 w-4" />;
    case "message":
      return <MessageSquare className="h-4 w-4" />;
    case "review":
      return <Star className="h-4 w-4" />;
    case "system":
      return <User className="h-4 w-4" />;
  }
};

const typeColor = (type: Notification["type"]) => {
  switch (type) {
    case "booking":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "reminder":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    case "message":
      return "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400";
    case "review":
      return "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400";
    case "system":
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
  }
};

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — GuideMe" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  useEffect(() => {
    if (!isAuthenticated) navigate({ to: "/login" });
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const filteredNotifications = (filter: "all" | "unread") =>
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Stay updated on your sessions, messages, and reminders.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <Check className="mr-1.5 h-3.5 w-3.5" />
            Mark all as read
          </Button>
        )}
      </div>

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
            items={filteredNotifications("all")}
            onMarkAsRead={markAsRead}
            onDelete={deleteNotification}
            emptyText="No notifications yet."
          />
        </TabsContent>

        <TabsContent value="unread" className="mt-6">
          <NotificationList
            items={filteredNotifications("unread")}
            onMarkAsRead={markAsRead}
            onDelete={deleteNotification}
            emptyText="No unread notifications."
          />
        </TabsContent>
      </Tabs>
    </div>
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
        <p className="text-sm font-medium text-muted-foreground">{emptyText}</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {items.map((n) => (
        <Card
          key={n.id}
          className={`flex items-start gap-4 p-4 transition-opacity ${
            n.read ? "opacity-70" : "opacity-100"
          }`}
        >
          <div
            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${typeColor(n.type)}`}
          >
            {typeIcon(n.type)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">{n.title}</p>
              {!n.read && (
                <span className="h-2 w-2 rounded-full bg-primary" />
              )}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
            <p className="mt-1 text-xs text-muted-foreground">{n.timestamp}</p>

            {n.link && (
              <div className="mt-2">
                <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
                  <Link to={n.link}>View details</Link>
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {!n.read && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => onMarkAsRead(n.id)}
                title="Mark as read"
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(n.id)}
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
