import { useRouterState } from "@/lib/router-compat";
import { useAuth } from "@/contexts/AuthContext";
import ChatbotWidget from "@/chatbot/ChatbotWidget";

export function AIFloatingWidget() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();

  // Hide for admin
  if (user?.role === "admin") return null;

  // Hide on the full AI assistant page (already has chatbot there)
  if (pathname === "/ai-assistant") return null;

  // Hide if not logged in
  if (!user) return null;

  return <ChatbotWidget />;
}
