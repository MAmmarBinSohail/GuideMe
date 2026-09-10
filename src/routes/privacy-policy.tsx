import { createFileRoute } from "@/lib/router-compat";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({ meta: [{ title: "Privacy Policy — GuideMe" }] }),
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: September 1, 2026</p>
        </div>
      </div>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed text-muted-foreground">

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">1. Introduction</h2>
          <p>
            GuideMe ("we", "our", or "us") is committed to protecting your personal information.
            This Privacy Policy explains how we collect, use, and safeguard your data when you
            use our platform at guideme-theta.vercel.app. By using GuideMe, you agree to the
            practices described in this policy.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">2. Information We Collect</h2>
          <p>We collect the following types of information:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong className="text-foreground">Account information:</strong> Name, email address, password (encrypted), and role (mentor or mentee)</li>
            <li><strong className="text-foreground">Profile information:</strong> Profile picture, phone number, bio, expertise areas, and professional details</li>
            <li><strong className="text-foreground">Booking information:</strong> Session dates, durations, and payment records</li>
            <li><strong className="text-foreground">Communication data:</strong> Messages exchanged with our AI assistant Mr.Guy-de</li>
            <li><strong className="text-foreground">Usage data:</strong> Pages visited, features used, and interactions with the platform</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">3. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To create and manage your account</li>
            <li>To facilitate mentorship session bookings</li>
            <li>To send booking confirmations and notifications</li>
            <li>To provide AI-powered mentor recommendations via Mr.Guy-de</li>
            <li>To process and record payments</li>
            <li>To improve our platform and user experience</li>
            <li>To send platform updates to subscribers (with your consent)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">4. Data Storage and Security</h2>
          <p>
            Your data is stored securely using Supabase (PostgreSQL) with Row Level Security
            policies ensuring that users can only access their own data. Profile pictures are
            stored in Supabase Storage with secure access controls. We use industry-standard
            encryption for all data in transit and at rest.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">5. Third-Party Services</h2>
          <p>We use the following third-party services:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong className="text-foreground">Supabase:</strong> Database, authentication, and file storage</li>
            <li><strong className="text-foreground">Vercel:</strong> Application hosting and deployment</li>
            <li><strong className="text-foreground">Google Gemini AI:</strong> AI chatbot functionality</li>
            <li><strong className="text-foreground">Jitsi Meet:</strong> Video meeting links generation</li>
            <li><strong className="text-foreground">Google Apps Script:</strong> Email notification delivery</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">6. Your Rights</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Access your personal data through your account settings</li>
            <li>Update or correct your information at any time</li>
            <li>Delete your account and associated data</li>
            <li>Unsubscribe from email communications</li>
            <li>Request a copy of your data by contacting us</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">7. Cookies</h2>
          <p>
            GuideMe uses essential cookies for authentication and session management only.
            We do not use tracking or advertising cookies.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">8. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <div className="mt-2 rounded-lg border p-3 bg-muted/30">
            <p><strong className="text-foreground">GuideMe</strong></p>
            <p>PUCIT, University of the Punjab, Lahore, Pakistan</p>
            <p>Email: contact@guideme.edu.pk</p>
          </div>
        </section>

      </div>
    </div>
  );
}