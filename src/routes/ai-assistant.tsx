import { createFileRoute, Link } from "@/lib/router-compat";
<<<<<<< HEAD
import { useState } from "react";
import { Sparkles, Send, Lock } from "lucide-react";
=======
import { useState, useEffect, useRef } from "react";
import { Sparkles, Send, Lock, Loader2 } from "lucide-react";
>>>>>>> 1d074f0 (feat: Mr.Guy de chatbot implementation complete)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/supabaseClient";
import {
  getOrCreateSession,
  loadMessages,
  sendChat
} from "@/chatbot/chatbotService";

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

interface Message {
  sender: string;
  message_text: string;
}

function AIAssistantPage() {
  const { isAuthenticated } = useAuth();
  const [messages, setMessages]         = useState<Message[]>([]);
  const [input, setInput]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [sessionId, setSessionId]       = useState<string | null>(null);
  const [phase, setPhase]               = useState("onboarding");
  const [onboardingData, setOnboardingData] = useState<Record<string, string>>({});
  const [userProfile, setUserProfile]   = useState<{full_name: string; role: string} | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check auth directly rather than relying on context
    // which may not be ready immediately on mount
    async function checkAndInit() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        initializeChat();
      } else {
        setInitializing(false);
      }
    }
    checkAndInit();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function initializeChat() {
    setInitializing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single();

      setUserProfile(profile);

      const session = await getOrCreateSession(user.id);
      if (!session) return;

      setSessionId(session.id);
      setPhase(session.phase || "onboarding");
      setOnboardingData(session.onboarding_data || {});

      const history = await loadMessages(session.id);

      if (history.length > 0) {
        setMessages(history);
      } else {
        const firstName = profile?.full_name?.split(" ")[0] || "there";
        const welcomeText = profile?.role === "mentor"
          ? `Hi ${firstName}! 👋 Welcome to Mr.Guy-de, your GuideMe AI assistant.\nI am here to help you get the most out of GuideMe as a mentor.\nBefore I help, I have a couple of quick questions.\n\nWhat aspect of GuideMe would you like help with? (Setting availability, pricing, managing sessions, verification, or something else?)`
          : `Hi ${firstName}! 👋 Welcome to Mr.Guy-de, your GuideMe AI assistant.\nI am here to help you find the right mentor and get the most out of GuideMe.\nBefore I help, I have a couple of quick questions.\n\nWhich area do you need guidance in? (Academic, Career, Business, Technology, Health, Personal, Creative, Finance, Legal, Leadership, Language, or Engineering)`;

        setMessages([{ sender: "bot", message_text: welcomeText }]);
      }
    } catch (err) {
      console.error("Chat init failed:", err);
    } finally {
      setInitializing(false);
    }
  }

  async function handleSend(text?: string) {
    const messageText = text || input.trim();
    if (!messageText || loading || !sessionId) return;

    setInput("");

    const userMsg: Message = { sender: "user", message_text: messageText };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const { botReply, newPhase, newOnboardingData } = await sendChat(
        sessionId,
        messageText,
        [...messages, userMsg],
        phase,
        onboardingData,
        userProfile?.full_name?.split(" ")[0] || "there",
        userProfile?.role || "mentee"
      );

      if (newPhase !== phase) {
        setPhase(newPhase);
        setOnboardingData(newOnboardingData);
      }

      setMessages(prev => [
        ...prev,
        { sender: "bot", message_text: botReply }
      ]);

    } catch (err) {
      console.error("Send failed:", err);
      setMessages(prev => [...prev, {
        sender: "bot",
        message_text: "Sorry, something went wrong. Please try again."
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md p-8 text-center shadow-elegant">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            Please login to chat with{" "}
            <span className="text-gradient-primary">Mr.Guy-de</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Our AI assistant is available to signed-in users only.
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

  return (
    <div className="container mx-auto flex h-[calc(100vh-4rem)] max-w-4xl flex-col px-4 py-6">

      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary shadow-elegant">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Mr.Guy-de</h1>
          <p className="text-xs text-muted-foreground">
            {phase === "onboarding"
              ? "Getting to know you..."
              : "Your AI mentorship assistant"}
          </p>
        </div>

        {/* Phase indicator */}
        {phase === "onboarding" && (
          <div className="ml-auto flex items-center gap-2">
            <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-primary rounded-full transition-all"
                style={{
                  width: `${(Object.keys(onboardingData).length / 3) * 100}%`
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {Object.keys(onboardingData).length}/3
            </span>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto rounded-2xl border bg-card p-6">
        {initializing ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                How can I guide you today?
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Ask about mentors, career paths, learning roadmaps and more.
              </p>
            </div>
            <div className="grid w-full max-w-2xl gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
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
                className={`flex ${
                  m.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {m.sender === "bot" && (
                  <div className="mr-2 mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-primary">
                    <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                    m.sender === "user"
                      ? "bg-gradient-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  }`}
                >
                  {m.message_text}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="mr-2 mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-primary">
                  <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-3 text-lg text-muted-foreground">
                  ···
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="mt-4 flex items-center gap-2 rounded-2xl border bg-card p-2 shadow-elegant"
      >
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            phase === "onboarding"
              ? "Answer the question..."
              : "Message Mr.Guy-de…"
          }
          disabled={loading || initializing}
          className="border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
        <Button
          type="submit"
          size="icon"
          disabled={loading || !input.trim() || initializing}
          className="rounded-xl bg-gradient-primary text-primary-foreground hover:opacity-90"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}