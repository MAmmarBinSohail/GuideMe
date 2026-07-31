import { supabase } from "@/supabaseClient";

export async function createNotification({
  user_id,
  type,
  title,
  message,
  related_booking_id,
}: {
  user_id: string;
  type: string;
  title: string;
  message: string;
  related_booking_id?: string;
}) {
  try {
    // Check user's notification preferences
    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user_id)
      .maybeSingle();

    // If preferences exist, check if this type is allowed
    if (prefs) {
      // Booking related notifications
      if (
        (type === "booking_confirmed" || type === "booking_cancelled") &&
        prefs.booking_alerts === false
      ) {
        console.log("Notification skipped: booking alerts disabled");
        return;
      }

      // Payment notifications
      if (type === "payment" && prefs.email_notifications === false) {
        console.log("Notification skipped: notifications disabled");
        return;
      }
    }

    // Create the notification
    await supabase.from("notifications").insert({
      user_id,
      type,
      title,
      message,
      related_booking_id: related_booking_id ?? null,
    });

  } catch (err) {
    console.error("Failed to create notification:", err);
  }
}