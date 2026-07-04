import { Link, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer, MinimalFooter } from "@/components/layout/Footer";
import { AIFloatingWidget } from "@/components/layout/AIFloatingWidget";
import { WelcomeModal } from "@/components/layout/WelcomeModal";

export function NotFoundComponent() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-60 [background:radial-gradient(60%_50%_at_50%_30%,hsl(var(--primary)/0.18),transparent_70%)]"
      />
      <div className="max-w-lg text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="relative mx-auto mb-6 h-40 w-40">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-primary/5 blur-2xl" />
          <div className="relative grid h-full w-full place-items-center">
            <svg viewBox="0 0 200 120" className="h-full w-full">
              <defs>
                <linearGradient id="g404" x1="0" x2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--primary) / 0.5)" />
                </linearGradient>
              </defs>
              <text
                x="50%"
                y="60%"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="80"
                fontWeight="800"
                fill="url(#g404)"
                fontFamily="ui-sans-serif, system-ui"
              >
                404
              </text>
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          We can't find that page
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          The link may be broken, or the page may have been moved. Let's get you back on track.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow transition-all hover:opacity-90 hover:shadow-md"
          >
            ← Go home
          </Link>
          <Link
            to="/mentors"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Browse mentors
          </Link>
        </div>
      </div>
    </div>
  );
}

export function RootLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="flex min-h-screen flex-col bg-background">
          <Navbar />
          <main className="flex-1">{children}</main>
          {isHome ? <Footer /> : <MinimalFooter />}
          <AIFloatingWidget />
          <WelcomeModal />
          <Toaster />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}
