import { createFileRoute } from "@/lib/router-compat";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/terms-of-service")({
  head: () => ({ meta: [{ title: "Terms of Service — GuideMe" }] }),
  component: TermsOfServicePage,
});

function TermsOfServicePage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 flex items-center gap-3">
        <FileText className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Last updated: September 1, 2026</p>
        </div>
      </div>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed text-muted-foreground">

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">1. Acceptance of Terms</h2>
          <p>
            By accessing or using GuideMe ("the Platform"), you agree to be bound by these
            Terms of Service. If you do not agree to these terms, please do not use the platform.
            GuideMe is an academic project developed at PUCIT, University of the Punjab, Lahore.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">2. User Accounts</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>You must provide accurate information when creating an account</li>
            <li>You are responsible for maintaining the security of your account credentials</li>
            <li>You may register as either a Mentee or a Mentor — roles cannot be changed after registration</li>
            <li>One account per person is permitted</li>
            <li>You must be at least 16 years old to use this platform</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">3. Mentor Responsibilities</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Mentors must provide accurate professional information in their profiles</li>
            <li>Mentors are responsible for honoring confirmed session bookings</li>
            <li>Mentors must set fair and transparent pricing</li>
            <li>Mentors must conduct sessions professionally and ethically</li>
            <li>Mentors may not provide unlicensed medical, legal, or financial advice</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">4. Mentee Responsibilities</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Mentees must attend booked sessions or cancel in advance</li>
            <li>Mentees must treat mentors with respect</li>
            <li>Mentees must provide honest reviews based on actual session experiences</li>
            <li>Mentees must complete payment for paid sessions</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">5. Payments</h2>
          <p>
            GuideMe uses a simulated payment system for demonstration purposes.
            GuideMe charges a 10% platform commission on all paid sessions.
            The remaining 90% is the mentor's payout.
            Payment methods supported: JazzCash, Easypaisa, Bank Transfer, Wise/Payoneer.
            Currently, no real financial transactions occur on this platform.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">6. Session Meetings</h2>
          <p>
            Sessions are conducted via auto-generated Jitsi Meet links. GuideMe is not
            responsible for technical issues with third-party video meeting services.
            Meeting links are only accessible to the booked mentor and mentee.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">7. AI Assistant</h2>
          <p>
            Mr.Guy-de is an AI assistant powered by Google Gemini. Responses are generated
            by artificial intelligence and should not be considered professional advice.
            Always consult qualified professionals for medical, legal, or financial matters.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">8. Content Policy</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Users must not upload offensive, harmful, or illegal content</li>
            <li>Spam, harassment, or abusive behavior will result in account termination</li>
            <li>Profile information must be truthful and professional</li>
            <li>Reviews must be honest and based on real experiences</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">9. Limitation of Liability</h2>
          <p>
            GuideMe is an academic project and is provided "as is" without warranties of any kind.
            We are not liable for any damages arising from the use of this platform, including
            session outcomes, mentor advice, or technical issues.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">10. Changes to Terms</h2>
          <p>
            We reserve the right to update these terms at any time. Continued use of the
            platform after changes constitutes acceptance of the updated terms.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-2">11. Contact</h2>
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