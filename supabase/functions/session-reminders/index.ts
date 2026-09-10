import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async () => {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Find confirmed bookings starting in 25-35 minutes
  const now = new Date();
  const from = new Date(now.getTime() + 25 * 60 * 1000).toISOString();
  const to = new Date(now.getTime() + 35 * 60 * 1000).toISOString();

  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      id,
      mentee_id,
      mentor_id,
      scheduled_at,
      mentor_profiles (
        user_id,
        profiles (full_name)
      ),
      profiles!bookings_mentee_id_fkey (full_name),
      meetings (meeting_link)
    `)
    .eq("status", "confirmed")
    .gte("scheduled_at", from)
    .lte("scheduled_at", to);

  if (!bookings || bookings.length === 0) {
    return new Response(JSON.stringify({ message: "No reminders needed" }));
  }

  for (const booking of bookings) {
    const mentorName = (booking.mentor_profiles as any)?.profiles?.full_name ?? "Your mentor";
    const menteeName = (booking.profiles as any)?.full_name ?? "Your mentee";
    const meetingLink = (booking.meetings as any)?.[0]?.meeting_link ?? "";
    const mentorUserId = (booking.mentor_profiles as any)?.user_id;

    // Notify mentee
    await supabase.from("notifications").insert({
      user_id: booking.mentee_id,
      type: "session_reminder",
      title: "Session Starting in 30 Minutes!",
      message: `Your session with ${mentorName} starts soon. ${meetingLink ? `Meeting link: ${meetingLink}` : "Check your dashboard for the meeting link."}`,
      related_booking_id: booking.id,
    });

    // Notify mentor
    if (mentorUserId) {
      await supabase.from("notifications").insert({
        user_id: mentorUserId,
        type: "session_reminder",
        title: "Session Starting in 30 Minutes!",
        message: `Your session with ${menteeName} starts soon. Be ready!`,
        related_booking_id: booking.id,
      });
    }
  }

  return new Response(
    JSON.stringify({ message: `Sent ${bookings.length} reminders` })
  );
});