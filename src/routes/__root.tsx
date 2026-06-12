import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer, MinimalFooter } from "@/components/layout/Footer";
import { AIFloatingWidget } from "@/components/layout/AIFloatingWidget";
import { WelcomeModal } from "@/components/layout/WelcomeModal";

function NotFoundComponent() {
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

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "GuideMe — Smart Mentorship Marketplace" },
      { name: "description", content: "Find expert mentors and counselors. Book sessions, learn from the best, and grow with AI-guided support." },
      { name: "author", content: "GuideMe" },
      { property: "og:title", content: "GuideMe — Smart Mentorship Marketplace" },
      { property: "og:description", content: "Find expert mentors and counselors. Book sessions, learn from the best, and grow with AI-guided support." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHome = pathname === "/";

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <div className="flex min-h-screen flex-col bg-background">
            <Navbar />
            <main className="flex-1">
              <Outlet />
            </main>
            {isHome ? <Footer /> : <MinimalFooter />}
            <AIFloatingWidget />
            <WelcomeModal />
          </div>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
