import { useState } from "react";
import { supabase } from "@/supabaseClient";
import { toast } from "sonner";
import { Link } from "@/lib/router-compat";
import {
  Sparkles,
  Mail,
  MapPin,
  Phone,
  Github,
  Linkedin,
  Instagram,
  Heart
} from "lucide-react";
import { FaXTwitter } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { MENTOR_CATEGORIES } from "@/lib/categories";
import { useAuth } from "@/contexts/AuthContext";
import { href } from "react-router-dom";

const CATEGORIES = MENTOR_CATEGORIES;

const SUPPORT_LINKS = [
  { label: "Help Center", href: "/ai-assistant" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "/mentors" },
  { label: "Terms of Service", href: "/terms-of-service" },
  { label: "Privacy Policy", href: "/privacy-policy" }
];

const SOCIALS = [
  { icon: FaXTwitter, label: "Twitter", href: "https://x.com/GuidMe_official" },
  { icon: Linkedin, label: "LinkedIn", href: "https://www.linkedin.com/in/ammarsohail56/" },
  { icon: Instagram, label: "Instagram", href: "https://www.instagram.com/guideme_llc?igsi=MWp6b3Bzd3I3N3R3cQ==" },
  { icon: Github, label: "GitHub", href: "https://github.com/MAmmarBinSohail/GuideMe" },
];

export function MinimalFooter() {
  return (
    <footer className="w-full border-t bg-card/50 backdrop-blur">
      <div className="container mx-auto px-4 py-5">
        <div className="flex flex-col items-center justify-center gap-2 text-center sm:flex-row sm:gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} GuideMe. All rights reserved.
          </p>
          <span className="hidden text-muted-foreground sm:inline">·</span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>Made with</span>
            <Heart className="h-3 w-3 fill-destructive text-destructive" />
            <span>Created in PUCIT, Lahore.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function Footer() {
  const { isAuthenticated } = useAuth();
  const [subEmail, setSubEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

async function handleSubscribe() {
    if (!subEmail.trim()) {
      toast.error("Please enter your email address.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(subEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setSubscribing(true);
    try {
      const { error } = await supabase
        .from("subscribers")
        .insert({ email: subEmail.trim().toLowerCase() });

      if (error) {
        if (error.code === "23505") {
          toast.error("This email is already subscribed.");
        } else {
          toast.error("Failed to subscribe. Please try again.");
        }
        return;
      }

      // Send welcome email via Edge Function
      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            to: subEmail.trim(),
            subject: "Welcome to GuideMe Newsletter!",
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 32px; border-radius: 12px 12px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 24px;">GuideMe</h1>
                  <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Your mentorship journey starts here</p>
                </div>
                <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                  <h2 style="color: #1f2937;">Welcome aboard! 🎉</h2>
                  <p style="color: #4b5563;">Thank you for subscribing to GuideMe updates. You will receive:</p>
                  <ul style="color: #4b5563;">
                    <li>New mentor announcements</li>
                    <li>Mentorship tips and career insights</li>
                    <li>Platform updates and new features</li>
                    <li>Exclusive offers for subscribers</li>
                  </ul>
                  <a href="https://guideme-theta.vercel.app/mentors" 
                     style="display: inline-block; background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">
                    Browse Mentors
                  </a>
                  <a href="https://guideme-theta.vercel.app/unsubscribe?email=${subEmail.trim()}" 
                    style="color: #9ca3af; font-size: 11px;">
                    Unsubscribe
                  </a>
                </div>
              </div>
            `
          }),
        }
      );

      toast.success("Successfully subscribed! Check your inbox for a welcome email.");
      setSubEmail("");

    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubscribing(false);
    }
  }

  const quickLinks = [
    { to: "/", label: "Home" },
    { to: "/mentors", label: "Browse Mentors" },
    { to: "/ai-assistant", label: "Mr.Guy-de AI" },
    ...(isAuthenticated
      ? []
      : [
          { to: "/register", label: "Become a Mentor" },
          { to: "/login", label: "Sign In" },
        ]),
  ];

  return (
    <footer className="w-full border-t bg-card/50 backdrop-blur">
      {/* Main footer content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12">
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-5">
            <Link to="/" className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary shadow-elegant">
                <Sparkles className="h-4.5 w-4.5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                Guide<span className="text-gradient-primary">Me</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Pakistan's smartest mentorship marketplace. Connect with expert mentors,
              book personalized sessions, and grow your career with AI-guided support.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span>University of the Punjab, Lahore, Pakistan</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <span>bsef22m056@pucit.edu.pk</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <span>+92-30-0079-3940</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {SOCIALS.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="grid h-9 w-9 place-items-center rounded-lg border bg-background text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-sm font-semibold tracking-wide uppercase">Quick Links</h4>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground transition hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-sm font-semibold tracking-wide uppercase">
              Mentorship Categories
            </h4>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.slug}
                  to="/mentors"
                  search={{ category: cat.slug }}
                  className="rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
                >
                  {cat.shortLabel}
                </Link>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-sm font-semibold tracking-wide uppercase">Stay Updated</h4>
            <p className="text-sm text-muted-foreground">
              Get mentorship tips, new mentor alerts, and career insights delivered to your inbox.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
              <Input
                type="email"
                placeholder="your@email.com"
                value={subEmail}
                onChange={(e) => setSubEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
                className="bg-background"
              />
              <Button
                disabled={subscribing}
                onClick={handleSubscribe}
                className="bg-gradient-primary text-primary-foreground hover:opacity-90"
              >
                {subscribing ? "..." : "Subscribe"}
              </Button>
            </form>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold tracking-wide uppercase">Support</h4>
              <ul className="space-y-2">
                {SUPPORT_LINKS.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground transition hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <div className="container mx-auto px-4 py-5">
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} GuideMe. All rights reserved.
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>Made with</span>
            <Heart className="h-3 w-3 fill-destructive text-destructive" />
            <span>Created in PUCIT, Lahore.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
