const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY;
const FROM_EMAIL = "ammaar.warsi02@gmail.com";
const FROM_NAME = "GuideMe";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(payload: EmailPayload): Promise<boolean> {
  if (!BREVO_API_KEY) {
    console.warn("Brevo API key not configured. Skipping email.");
    return false;
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: {
          name: FROM_NAME,
          email: FROM_EMAIL,
        },
        to: [{ email: payload.to }],
        subject: payload.subject,
        htmlContent: payload.html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Brevo error:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Email send failed:", err);
    return false;
  }
}

// ─── EMAIL TEMPLATES ─────────────────────────────

export async function sendBookingConfirmationEmail(
  toEmail: string,
  menteeName: string,
  mentorName: string,
  date: string,
  time: string,
  meetingLink: string
) {
  return sendEmail({
    to: toEmail,
    subject: `Booking Confirmed — Session with ${mentorName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">GuideMe</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Your mentorship journey continues</p>
        </div>
        <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <h2 style="color: #1f2937; margin: 0 0 16px;">Booking Confirmed! 🎉</h2>
          <p style="color: #4b5563;">Hi ${menteeName},</p>
          <p style="color: #4b5563;">Your session with <strong>${mentorName}</strong> has been confirmed.</p>
          
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Session Details</p>
            <p style="margin: 0 0 4px; color: #1f2937;"><strong>Mentor:</strong> ${mentorName}</p>
            <p style="margin: 0 0 4px; color: #1f2937;"><strong>Date:</strong> ${date}</p>
            <p style="margin: 0 0 4px; color: #1f2937;"><strong>Time:</strong> ${time}</p>
          </div>

          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 8px; color: #1e40af; font-size: 12px; font-weight: 600;">YOUR MEETING LINK</p>
            <a href="${meetingLink}" style="color: #2563eb; word-break: break-all;">${meetingLink}</a>
          </div>

          <a href="${meetingLink}" style="display: inline-block; background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 8px;">
            Join Meeting
          </a>

          <p style="color: #6b7280; font-size: 12px; margin-top: 32px;">
            You can also manage your booking from your 
            <a href="https://guideme-theta.vercel.app/dashboard/mentee" style="color: #4F46E5;">GuideMe Dashboard</a>.
          </p>
        </div>
      </div>
    `,
  });
}

export async function sendBookingCancellationEmail(
  toEmail: string,
  userName: string,
  mentorName: string,
  date: string
) {
  return sendEmail({
    to: toEmail,
    subject: `Booking Cancelled — Session with ${mentorName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">GuideMe</h1>
        </div>
        <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <h2 style="color: #1f2937; margin: 0 0 16px;">Booking Cancelled</h2>
          <p style="color: #4b5563;">Hi ${userName},</p>
          <p style="color: #4b5563;">Your session with <strong>${mentorName}</strong> scheduled for <strong>${date}</strong> has been cancelled.</p>
          <a href="https://guideme-theta.vercel.app/mentors" style="display: inline-block; background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">
            Browse Mentors
          </a>
        </div>
      </div>
    `,
  });
}

export async function sendSessionCompleteEmail(
  toEmail: string,
  menteeName: string,
  mentorName: string
) {
  return sendEmail({
    to: toEmail,
    subject: `How was your session with ${mentorName}?`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">GuideMe</h1>
        </div>
        <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <h2 style="color: #1f2937; margin: 0 0 16px;">Session Complete! ⭐</h2>
          <p style="color: #4b5563;">Hi ${menteeName},</p>
          <p style="color: #4b5563;">Your session with <strong>${mentorName}</strong> is now complete.</p>
          <p style="color: #4b5563;">How was your experience? Leave a review to help other mentees find the right mentor.</p>
          <a href="https://guideme-theta.vercel.app/dashboard/mentee" style="display: inline-block; background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">
            Leave a Review
          </a>
        </div>
      </div>
    `,
  });
}

export async function sendOverageChargeEmail(
  toEmail: string,
  menteeName: string,
  mentorName: string,
  extraMinutes: number,
  amount: number
) {
  return sendEmail({
    to: toEmail,
    subject: `Additional charge for extended session with ${mentorName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">GuideMe</h1>
        </div>
        <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <h2 style="color: #1f2937; margin: 0 0 16px;">Additional Session Charge</h2>
          <p style="color: #4b5563;">Hi ${menteeName},</p>
          <p style="color: #4b5563;">Your session with <strong>${mentorName}</strong> ran for an additional <strong>${extraMinutes} minutes</strong> beyond the booked duration.</p>
          
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px; text-transform: uppercase;">Charge Details</p>
            <p style="margin: 0 0 4px; color: #1f2937;"><strong>Extra minutes:</strong> ${extraMinutes} min</p>
            <p style="margin: 0; color: #1f2937;"><strong>Amount charged:</strong> PKR ${amount}</p>
          </div>

          <p style="color: #6b7280; font-size: 12px;">
            View your payment history in your 
            <a href="https://guideme-theta.vercel.app/dashboard/mentee" style="color: #4F46E5;">GuideMe Dashboard</a>.
          </p>
        </div>
      </div>
    `,
  });
}