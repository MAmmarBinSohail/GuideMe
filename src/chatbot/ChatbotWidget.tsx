import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import {
  getOrCreateSession,
  loadMessages,
  sendChat
} from './chatbotService';

const WELCOME_MESSAGE = {
  sender: 'bot',
  message_text: `Hi there! 👋 Welcome to GuideMe.
Before I help you find the right mentor, I have
a few quick questions to better understand your needs.`
};

export default function ChatbotWidget() {
  const [isOpen, setIsOpen]             = useState(false);
  const [messages, setMessages]         = useState([]);
  const [input, setInput]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [sessionId, setSessionId]       = useState(null);
  const [initialized, setInitialized]   = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [phase, setPhase]               = useState('onboarding');
  const [onboardingData, setOnboardingData] = useState({});
  const [userProfile, setUserProfile] = useState<{full_name: string; role: string} | null>(null);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Check auth on mount
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setIsAuthorized(true);
    }
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsAuthorized(!!session?.user);
        if (!session?.user) {
          // Reset chat when user logs out
          setIsOpen(false);
          setInitialized(false);
          setMessages([]);
          setSessionId(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Initialize chat when opened
  useEffect(() => {
    if (isOpen && !initialized && isAuthorized) {
      initializeChat();
    }
  }, [isOpen, isAuthorized, initialized]);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  async function initializeChat() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user profile to get name and role
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single();

      setUserProfile(profile);

      const session = await getOrCreateSession(user.id);
      if (!session) return;

      setSessionId(session.id);
      setPhase(session.phase || 'onboarding');
      setOnboardingData(session.onboarding_data || {});

      const history = await loadMessages(session.id);

      if (history.length > 0) {
        const validMessages = history.filter(
          m => m.message_text && m.message_text.trim() !== ''
        );
        if (validMessages.length > 0) {
          setMessages(validMessages);
          setInitialized(true);
          return;
        }
      }

      // New session — generate personalized welcome
      const welcomeText = profile?.role === 'mentor'
        ? `Hi ${profile?.full_name?.split(' ')[0] || 'there'}! 👋 Welcome to GuideMe Assistant.\nI am here to help you get the most out of GuideMe as a mentor.\nBefore I help, I have a couple of quick questions.\n\nWhat aspect of GuideMe would you like help with? (Setting availability, pricing, managing sessions, verification, or something else?)`
        : `Hi ${profile?.full_name?.split(' ')[0] || 'there'}! 👋 Welcome to GuideMe Assistant.\nI am here to help you find the right mentor and get the most out of GuideMe.\nBefore I help, I have a couple of quick questions.\n\nWhich area do you need guidance in? (Academic, Career, Business, Technology, Health, Personal, Creative, Finance, Legal, Leadership, Language, or Engineering)`;

      setMessages([{
        sender: 'bot',
        message_text: welcomeText
      }]);

      setInitialized(true);

    } catch (err) {
      console.error('Chat initialization failed:', err);
    }
  } 

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || loading || !sessionId) return;

    setInput('');

    const userMsg = { sender: 'user', message_text: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const { botReply, newPhase, newOnboardingData } = await sendChat(
        sessionId,
        trimmed,
        [...messages, userMsg],
        phase,
        onboardingData,
        userProfile?.full_name?.split(' ')[0] || 'there',
        userProfile?.role || 'mentee'
      );

      if (newPhase !== phase) {
        setPhase(newPhase);
        setOnboardingData(newOnboardingData);
      }

      setMessages(prev => [
        ...prev,
        { sender: 'bot', message_text: botReply }
      ]);

    } catch (err) {
      console.error('Send failed:', err);
      setMessages(prev => [...prev, {
        sender: 'bot',
        message_text: 'Sorry, something went wrong. Please try again.'
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Hide widget entirely if not logged in
  if (!isAuthorized) return null;

  const phaseLabel = phase === 'onboarding'
    ? '📋 Getting to know you...'
    : '💬 Ask me anything';

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 9999,
      fontFamily: 'sans-serif'
    }}>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: 70,
          right: 0,
          width: 360,
          height: 520,
          background: 'white',
          borderRadius: 16,
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #E5E7EB'
        }}>

          {/* Header */}
          <div style={{
            background: '#4F46E5',
            color: 'white',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>
                Mr.Guy-de -- Your GuideMe Assistant
              </div>
              <div style={{ fontSize: 11, opacity: 0.85 }}>
                {phaseLabel}
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: 18,
                cursor: 'pointer',
                lineHeight: 1
              }}>
              ✕
            </button>
          </div>

          {/* Phase Progress Bar */}
          {phase === 'onboarding' && (
            <div style={{ height: 3, background: '#E0E7FF' }}>
              <div style={{
                height: '100%',
                background: '#818CF8',
                width: `${(Object.keys(onboardingData).length / 5) * 100}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>
          )}

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 14px',
            background: '#F9FAFB'
          }}>
            {messages.map((msg, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: msg.sender === 'user'
                  ? 'flex-end'
                  : 'flex-start',
                marginBottom: 10
              }}>
                <div style={{
                  background: msg.sender === 'user'
                    ? '#4F46E5'
                    : 'white',
                  color: msg.sender === 'user'
                    ? 'white'
                    : '#1F2937',
                  padding: '10px 14px',
                  borderRadius: msg.sender === 'user'
                    ? '16px 16px 4px 16px'
                    : '16px 16px 16px 4px',
                  maxWidth: '78%',
                  fontSize: 13.5,
                  lineHeight: 1.5,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  whiteSpace: 'pre-wrap'
                }}>
                  {msg.message_text}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {loading && (
              <div style={{
                display: 'flex',
                justifyContent: 'flex-start',
                marginBottom: 10
              }}>
                <div style={{
                  background: 'white',
                  padding: '10px 16px',
                  borderRadius: '16px 16px 16px 4px',
                  fontSize: 18,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  color: '#6B7280'
                }}>
                  ···
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '10px 12px',
            borderTop: '1px solid #E5E7EB',
            background: 'white',
            display: 'flex',
            gap: 8
          }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                phase === 'onboarding'
                  ? 'Answer the question...'
                  : 'Ask me anything...'
              }
              disabled={loading}
              style={{
                flex: 1,
                border: '1.5px solid #E5E7EB',
                borderRadius: 10,
                padding: '9px 13px',
                fontSize: 13.5,
                outline: 'none',
                background: loading ? '#F9FAFB' : 'white',
                color: '#1F2937'
              }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              style={{
                background: loading || !input.trim()
                  ? '#A5B4FC'
                  : '#4F46E5',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                padding: '9px 16px',
                cursor: loading || !input.trim()
                  ? 'not-allowed'
                  : 'pointer',
                fontSize: 13.5,
                fontWeight: 600,
                transition: 'background 0.2s'
              }}>
              Send
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: 58,
          height: 58,
          borderRadius: '50%',
          background: '#4F46E5',
          color: 'white',
          fontSize: 26,
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(79,70,229,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s'
        }}>
        {isOpen ? '✕' : '💬'}
      </button>

    </div>
  );
}