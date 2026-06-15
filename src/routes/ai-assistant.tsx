import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Send, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MOCK_AI_MESSAGES, type ChatMessage } from "@/lib/mock-data";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/ai-assistant")({
  head: () => ({ meta: [{ title: "Mr.Guy-de — AI Assistant" }] }),
  component: AIAssistantPage,
});

const SUGGESTIONS = [
  "Help me find a mentor for product design",
  "What career path fits a CS graduate?",
  "How do I prepare for a tech interview?",
  "Recommend a roadmap to learn data science",
];

const CANNED_REPLY =
  "Great question! I can connect you with a relevant mentor and outline a step-by-step plan. (This is a demo response — real AI responses will be wired in next.)";

function AIAssistantPage() {
  const { isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_AI_MESSAGES);
  const [input, setInput] = useState("");

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md p-8 text-center shadow-elegant">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            Please login to chat with <span className="text-gradient-primary">Mr.Guy-de</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Our flagship AI assistant is available to signed-in users only.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button
              asChild
              className="bg-gradient-primary text-primary-foreground hover:opacity-90"
            >
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/register">Create an account</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages((m) => [
      ...m,
      { role: "user", content: text },
      { role: "assistant", content: CANNED_REPLY },
    ]);
    setInput("");
  };

  return (
    <div className="container mx-auto flex h-[calc(100vh-4rem)] max-w-4xl flex-col px-4 py-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary shadow-elegant">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Mr.Guy-de</h1>
          <p className="text-xs text-muted-foreground">Your AI mentorship assistant</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto rounded-2xl border bg-card p-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">How can I guide you today?</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Ask about mentors, career paths, learning roadmaps and more.
              </p>
            </div>
            <div className="grid w-full max-w-2xl gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-xl border bg-background p-3 text-left text-sm text-muted-foreground transition hover:border-primary hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-gradient-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-4 flex items-center gap-2 rounded-2xl border bg-card p-2 shadow-elegant"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message Mr.Guy-de…"
          className="border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
        <Button
          type="submit"
          size="icon"
          className="rounded-xl bg-gradient-primary text-primary-foreground hover:opacity-90"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
