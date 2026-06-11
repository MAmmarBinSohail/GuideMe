import { useState } from "react";
import { useRouterState, Link } from "@tanstack/react-router";
import { MessageCircle, X, Send, Sparkles, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";

export function AIFloatingWidget() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");

  if (pathname === "/ai-assistant") return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-3 flex h-[460px] w-[min(340px,calc(100vw-3rem))] flex-col overflow-hidden rounded-2xl border bg-popover shadow-elegant">
          <div className="flex items-center justify-between border-b bg-gradient-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-semibold">Mr.Guy-de</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full p-1 hover:bg-white/20"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {isAuthenticated ? (
            <>
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Hi! I'm Mr.Guy-de, your AI mentorship assistant. Ask me anything to get started.
                </p>
                <Link
                  to="/ai-assistant"
                  className="mt-3 text-xs font-medium text-primary hover:underline"
                >
                  Open full assistant →
                </Link>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setInput("");
                }}
                className="flex items-center gap-2 border-t p-3"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Mr.Guy-de…"
                  className="h-9"
                />
                <Button type="submit" size="icon" className="h-9 w-9 bg-gradient-primary text-primary-foreground">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-primary">
                <Lock className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium">
                Please login to chat with <span className="text-gradient-primary">Mr.Guy-de</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Our flagship AI assistant is available to signed-in users only.
              </p>
              <div className="flex w-full flex-col gap-2 pt-2">
                <Button
                  asChild
                  size="sm"
                  className="bg-gradient-primary text-primary-foreground"
                >
                  <Link to="/login" onClick={() => setOpen(false)}>Log in</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link to="/register" onClick={() => setOpen(false)}>Sign up</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Button
        onClick={() => setOpen((v) => !v)}
        size="icon"
        className="h-14 w-14 rounded-full bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-90"
        aria-label="Open AI chat"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>
    </div>
  );
}
