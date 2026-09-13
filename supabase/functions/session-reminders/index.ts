import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GOOGLE_SCRIPT_URL = Deno.env.get("GOOGLE_SCRIPT_URL")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { booking_id } = await req.json();

    if (!booking_id) {
      return new Response(
        JSON.stringify({ error: "booking_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Fetch booking details
    const { data: booking, error } = await supabase
      .from("bookings")
      .select(`
        id,
        scheduled_at,
        duration_minutes,
        status,
        mentee_id,
        mentor_id,
        profiles!bookings_mentee_id_fkey (
          full_name,
          email
        ),
        mentor_profiles (
          user_id,
          profiles (
            full_name,
            email
          )
        ),
        meetings (
          meeting_link
        )
      `)
      .eq("id", booking_id)
      .single();

    if (error || !booking) {
      return new Response(
        JSON.stringify({ error: "Booking not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only send reminders for confirmed bookings
    if (booking.status !== "confirmed") {
      return new Response(
        JSON.stringify({ message: "Booking is not confirmed, skipping reminder" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const menteeName = (booking.profiles as any)?.full_name ?? "Mentee";
    const menteeEmail = (booking.profiles as any)?.email ?? "";
    const mentorName = (booking.mentor_profiles as any)?.profiles?.full_name ?? "Mentor";
    const mentorEmail = (booking.mentor_profiles as any)?.profiles?.email ?? "";
    const mentorUserId = (booking.mentor_profiles as any)?.user_id;
    const meetingLink = (booking.meetings as any)?.[0]?.meeting_link ?? "";

    const sessionTime = new Date(booking.scheduled_at).toLocaleString("en-PK", {
      timeZone: "Asia/Karachi",
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    // 1. Send in-app notification to mentee
    await supabase.from("notifications").insert({
      user_id: booking.mentee_id,
      type: "session_reminder",
      title: "⏰ Session Starting in 30 Minutes!",
      message: `Your session with ${mentorName} starts at ${sessionTime} PKT. ${meetingLink ? `Meeting link: ${meetingLink}` : "Check your dashboard for the meeting link."}`,
      related_booking_id: booking.id,
    });

    // 2. Send in-app notification to mentor
    if (mentorUserId) {
      await supabase.from("notifications").insert({
        user_id: mentorUserId,
        type: "session_reminder",
        title: "⏰ Session Starting in 30 Minutes!",
        message: `Your session with ${menteeName} starts at ${sessionTime} PKT. Be ready!`,
        related_booking_id: booking.id,
      });
    }

    // 3. Send email to mentee
    if (menteeEmail) {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: menteeEmail,
          subject: `⏰ Reminder: Session with ${mentorName} in 30 minutes`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 32px; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">GuideMe</h1>
                <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Session Reminder</p>
              </div>
              <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                <h2 style="color: #1f2937;">⏰ Your session starts in 30 minutes!</h2>
                <p style="color: #4b5563;">Hi ${menteeName},</p>
                <p style="color: #4b5563;">This is a reminder that your session with <strong>${mentorName}</strong> starts at <strong>${sessionTime} PKT</strong>.</p>
                ${meetingLink ? `
                <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 24px 0;">
                  <p style="margin: 0 0 8px; color: #1e40af; font-size: 12px; font-weight: 600;">YOUR MEETING LINK</p>
                  <a href="${meetingLink}" style="color: #2563eb; word-break: break-all;">${meetingLink}</a>
                </div>
                <a href="${meetingLink}" style="display: inline-block; background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Join Meeting Now
                </a>
                ` : ''}
              </div>
            </div>
          `,
        }),
        redirect: "follow",
      });
    }

    // 4. Send email to mentor
    if (mentorEmail) {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: mentorEmail,
          subject: `⏰ Reminder: Session with ${menteeName} in 30 minutes`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 32px; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">GuideMe</h1>
                <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Session Reminder</p>
              </div>
              <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                <h2 style="color: #1f2937;">⏰ Your session starts in 30 minutes!</h2>
                <p style="color: #4b5563;">Hi ${mentorName},</p>
                <p style="color: #4b5563;">This is a reminder that your session with <strong>${menteeName}</strong> starts at <strong>${sessionTime} PKT</strong>.</p>
                <p style="color: #4b5563;">Please be ready and ensure your meeting setup is working.</p>
                <a href="https://guideme-theta.vercel.app/dashboard/mentor" style="display: inline-block; background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">
                  Go to Dashboard
                </a>
              </div>
            </div>
          `,
        }),
        redirect: "follow",
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Reminders sent for booking ${booking_id}`,
        menteeNotified: !!menteeEmail,
        mentorNotified: !!mentorEmail,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Session reminder error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}); 