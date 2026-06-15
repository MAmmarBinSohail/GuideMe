import { Link } from "@tanstack/react-router";
import {
  Sparkles,
  Mail,
  MapPin,
  Phone,
  Github,
  Twitter,
  Linkedin,
  Instagram,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { MENTOR_CATEGORIES } from "@/lib/categories";
import { useAuth } from "@/contexts/AuthContext";

const CATEGORIES = MENTOR_CATEGORIES;

const SUPPORT_LINKS = [
  { label: "Help Center", href: "#" },
  { label: "How It Works", href: "#" },
  { label: "Pricing", href: "#" },
  { label: "Terms of Service", href: "#" },
  { label: "Privacy Policy", href: "#" },
  { label: "Cookie Policy", href: "#" },
];

const SOCIALS = [
  { icon: Twitter, label: "Twitter", href: "#" },
  { icon: Linkedin, label: "LinkedIn", href: "#" },
  { icon: Instagram, label: "Instagram", href: "#" },
  { icon: Github, label: "GitHub", href: "#" },
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
                <span>contact@guideme.edu.pk</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <span>+92-42-9902-XXXX</span>
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
                className="h-10 rounded-lg text-sm"
              />
              <Button
                type="submit"
                size="sm"
                className="rounded-lg bg-gradient-primary text-primary-foreground hover:opacity-90 shrink-0"
              >
                Subscribe
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
