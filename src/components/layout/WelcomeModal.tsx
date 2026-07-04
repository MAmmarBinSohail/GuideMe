"use client";

import { useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";
import {
  Bot,
  Users,
  LayoutGrid,
  Wallet,
  Award,
  Clock,
  ShieldCheck,
  MessageCircle,
  Sparkles,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const FEATURES = [
  { icon: Users, text: "500+ people guided towards a brighter future" },
  { icon: Bot, text: "AI-powered mentor chatbot — Mr.Guy-de" },
  { icon: LayoutGrid, text: "8+ mentorship categories to explore" },
  { icon: Wallet, text: "Affordable pricing for every budget" },
  { icon: Award, text: "Vetted, top-rated expert mentors" },
  { icon: Clock, text: "On-demand session booking" },
  { icon: ShieldCheck, text: "Secure & private consultations" },
];

const STORAGE_KEY = "guideme_welcome_seen";

export function WelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      const timer = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        onClick={handleClose}
        className="max-h-[90vh] w-[95vw] max-w-3xl gap-0 overflow-y-auto border-0 p-0 sm:rounded-2xl"
      >
        {/* Gradient header */}
        <div className="relative bg-gradient-primary px-6 pt-6 pb-5 text-primary-foreground sm:px-8 sm:pt-8 sm:pb-6">
          <button
            onClick={handleClose}
            className="absolute right-3 top-3 rounded-full bg-white/15 p-1.5 text-primary-foreground transition hover:bg-white/30"
            aria-label="Close welcome modal"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 shadow-lg backdrop-blur-sm">
              <Sparkles className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Welcome to GuideMe
              </h2>
              <p className="text-sm text-primary-foreground/80">
                Your smart mentorship marketplace
              </p>
            </div>
          </div>
        </div>

        {/* Body: two columns */}
        <div className="grid grid-cols-1 gap-0 sm:grid-cols-5">
          {/* Left: Features */}
          <div className="px-6 py-5 sm:col-span-3">
            <DialogHeader className="mb-4 text-left">
              <DialogTitle className="text-base font-semibold">
                What you can do here
              </DialogTitle>
              <DialogDescription className="text-xs">
                Explore everything GuideMe has to offer.
              </DialogDescription>
            </DialogHeader>

            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {FEATURES.map((f, i) => {
                const Icon = f.icon;
                return (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 rounded-lg bg-muted/50 px-3 py-2 text-sm"
                  >
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-elegant">
                      <Icon className="h-3 w-3" />
                    </div>
                    <span className="text-foreground/90 leading-snug">{f.text}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Right: CTA card */}
          <div className="flex flex-col justify-center bg-gradient-soft px-6 py-5 sm:col-span-2">
            <div className="rounded-xl border bg-card/80 p-5 text-center shadow-sm backdrop-blur-sm">
              <div className="flex items-center justify-center gap-2 text-sm font-semibold text-foreground">
                <Bot className="h-4 w-4 text-primary" />
                Try our flagship feature
              </div>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Mr.Guy-de, the AI chatbot that guides you to the perfect mentor in seconds.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <Button
                  asChild
                  className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90"
                  onClick={handleClose}
                >
                  <Link to="/ai-assistant">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Chat with Mr.Guy-de
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleClose}
                  asChild
                >
                  <Link to="/mentors">Browse mentors</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
