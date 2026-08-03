import { useNavigate } from '@/lib/router-compat';

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
  const [quickReplies, setQuickReplies] = useState<{label: string; value: string; action?: string}[]>([]);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const navigate = useNavigate();

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

      const welcomeMsg = { sender: 'bot', message_text: welcomeText };
      setMessages([welcomeMsg]);

      // Generate quick replies for welcome message
      const replies = getQuickReplies(
        'onboarding',
        welcomeText,
        profile?.role || 'mentee'
      );
      setQuickReplies(replies);

      setInitialized(true);

    } catch (err) {
      console.error('Chat initialization failed:', err);
    }
  }
  
  function getQuickReplies(
    phase: string,
    botMessage: string,
    userRole: string
  ): {label: string; value: string; action?: string}[] {
    const msg = botMessage.toLowerCase();

    // ─── ONBOARDING PHASE ────────────────────────────

    // Mentee category question
    if (
      phase === 'onboarding' &&
      msg.includes('which area do you need guidance')
    ) {
      return [
        { label: '🎓 Academic', value: 'Academic' },
        { label: '💼 Career', value: 'Career' },
        { label: '💰 Business', value: 'Business' },
        { label: '💻 Technology', value: 'Technology' },
        { label: '❤️ Health', value: 'Health' },
        { label: '🌱 Personal', value: 'Personal' },
        { label: '🎨 Creative', value: 'Creative' },
        { label: '📈 Finance', value: 'Finance' },
        { label: '⚖️ Legal', value: 'Legal' },
        { label: '👑 Leadership', value: 'Leadership' },
        { label: '🗣️ Language', value: 'Language' },
        { label: '⚙️ Engineering', value: 'Engineering' },
      ];
    }

    // Mentor platform question
    if (
      phase === 'onboarding' &&
      msg.includes('what aspect of guideme')
    ) {
      return [
        { label: '📅 Availability', value: 'Setting availability' },
        { label: '💵 Pricing', value: 'Pricing and rates' },
        { label: '📋 Sessions', value: 'Managing sessions' },
        { label: '✅ Verification', value: 'Getting verified' },
        { label: '🎥 Videos', value: 'Adding videos' },
        { label: '❓ Other', value: 'General platform help' },
      ];
    }

    // Onboarding concern question
    if (
      phase === 'onboarding' &&
      (msg.includes('struggling with') ||
       msg.includes('looking for help') ||
       msg.includes('describe what'))
    ) {
      if (userRole === 'mentee') {
        return [
          { label: '🎯 Job hunting', value: 'I am looking for a job' },
          { label: '📝 CV / Resume', value: 'I need help with my CV' },
          { label: '🎓 University admission', value: 'I want guidance on university admission' },
          { label: '💡 Career switch', value: 'I want to switch my career' },
          { label: '📚 Study help', value: 'I need help with my studies' },
          { label: '🚀 Start a business', value: 'I want to start a business' },
          { label: '🧠 Personal growth', value: 'I want to improve myself personally' },
          { label: '✍️ Other', value: 'Something else' },
        ];
      }
    }

    // Background / education question
    if (
      phase === 'onboarding' &&
      (msg.includes('education level') ||
       msg.includes('professional background') ||
       msg.includes('current situation'))
    ) {
      return [
        { label: '🎓 Student', value: 'I am currently a student' },
        { label: '📜 Fresh Graduate', value: 'I am a fresh graduate' },
        { label: '💼 Working Professional', value: 'I am a working professional' },
        { label: '🏢 Business Owner', value: 'I own a business' },
        { label: '🔄 Career Changer', value: 'I am looking to change my career' },
      ];
    }

    // Mentor mentoring practice question
    if (
      phase === 'onboarding' &&
      msg.includes('mentoring practice')
    ) {
      return [
        { label: '📅 Session management', value: 'Managing and scheduling sessions' },
        { label: '💰 Pricing strategy', value: 'Setting the right pricing' },
        { label: '👥 Getting more mentees', value: 'How to attract more mentees' },
        { label: '⭐ Reviews and ratings', value: 'How reviews and ratings work' },
        { label: '❓ Nothing specific', value: 'Nothing specific right now' },
      ];
    }

    // ─── CONVERSATION PHASE ───────────────────────────

    // Just completed onboarding
    if (
      msg.includes('feel free to ask me anything') ||
      msg.includes('i am ready to help')
    ) {
      if (userRole === 'mentor') {
        return [
          { label: '📅 Set availability', value: 'How do I set my availability?' },
          { label: '💵 Set pricing', value: 'How do I set my pricing?' },
          { label: '✅ Get verified', value: 'How do I get verified?' },
          { label: '💰 Add overage charge', value: 'How do I add an overage charge?' },
          { label: '🎥 Add videos', value: 'How do I add my videos?' },
        ];
      } else {
        return [
          { label: '🔍 Browse mentors', value: 'browse_mentors', action: 'navigate:/mentors' },
          { label: '📅 How to book', value: 'How do I book a session?' },
          { label: '💬 Recommend a mentor', value: 'Can you recommend a mentor for me?' },
          { label: '❓ How it works', value: 'How does GuideMe work?' },
        ];
      }
    }

    // After mentor recommendation
    if (
      phase === 'conversation' &&
      (msg.includes('i recommend') ||
       msg.includes('based on your') ||
       msg.includes('perfect mentor') ||
       msg.includes('great mentor'))
    ) {
      const categories = [
        'academic', 'career', 'business', 'technology',
        'health', 'personal', 'creative', 'finance',
        'legal', 'leadership', 'language', 'engineering'
      ];
      const foundCategory = categories.find(cat =>
        msg.includes(cat)
      );

      const buttons: {label: string; value: string; action?: string}[] = [];
      if (foundCategory) {
        buttons.push({
          label: `🔍 Browse ${foundCategory} mentors`,
          value: `browse_${foundCategory}`,
          action: `navigate:/mentors?category=${foundCategory}`
        });
      }
      buttons.push({
        label: '👥 Browse all mentors',
        value: 'browse_all',
        action: 'navigate:/mentors'
      });
      buttons.push({
        label: '💬 Ask another question',
        value: 'What else can you help me with?'
      });
      return buttons;
    }

    // After booking/platform explanation
    if (
      phase === 'conversation' &&
      (msg.includes('book a session') ||
       msg.includes('booking page') ||
       msg.includes('select a date'))
    ) {
      return [
        { label: '🔍 Browse mentors', value: 'browse_all', action: 'navigate:/mentors' },
        { label: '💬 Recommend a mentor', value: 'Can you recommend a mentor for me?' },
        { label: '❓ More questions', value: 'I have more questions' },
      ];
    }

    // After availability explanation (mentor)
    if (
      phase === 'conversation' &&
      userRole === 'mentor' &&
      (msg.includes('availability tab') ||
       msg.includes('time block') ||
       msg.includes('weekly schedule'))
    ) {
      return [
        { label: '💵 Set pricing', value: 'How do I set my pricing?' },
        { label: '✅ Get verified', value: 'How do I get verified?' },
        { label: '📋 Manage bookings', value: 'How do I manage my bookings?' },
        { label: '❓ More questions', value: 'I have more questions' },
      ];
    }

    // After pricing explanation (mentor)
    if (
      phase === 'conversation' &&
      userRole === 'mentor' &&
      (msg.includes('pricing tab') ||
       msg.includes('initial session') ||
       msg.includes('overage rate'))
    ) {
      return [
        { label: '📅 Set availability', value: 'How do I set my availability?' },
        { label: '✅ Get verified', value: 'How do I get verified?' },
        { label: '💰 Add extra time charge', value: 'How do I charge for extra session time?' },
        { label: '❓ More questions', value: 'I have more questions' },
      ];
    }

    // How to book
    if (
      phase === 'conversation' &&
      (msg.includes('how do i book') ||
       msg.includes('how to book') ||
       msg.includes('book a session'))
    ) {
      return [
        { label: '🔍 Browse Mentors', value: 'browse_all', action: 'navigate:/mentors' },
        { label: '💬 Recommend a mentor', value: 'Can you recommend a mentor for me?' },
        { label: '❓ More questions', value: 'I have more questions' },
      ];
    }

    // How to pay
    if (
      phase === 'conversation' &&
      (msg.includes('how do i pay') ||
       msg.includes('payment') ||
       msg.includes('jazzcash') ||
       msg.includes('easypaisa'))
    ) {
      return [
        { label: '🔍 Browse Mentors to Book', value: 'browse_all', action: 'navigate:/mentors' },
        { label: '❓ More questions', value: 'I have more questions' },
      ];
    }

    // Notifications
    if (
      phase === 'conversation' &&
      (msg.includes('notification') ||
       msg.includes('alert'))
    ) {
      return [
        { label: '🔔 View Notifications', value: 'view_notifications', action: 'navigate:/notifications' },
        { label: '⚙️ Notification Settings', value: 'view_settings', action: 'navigate:/settings' },
        { label: '❓ More questions', value: 'I have more questions' },
      ];
    }

    // Settings related
    if (
      phase === 'conversation' &&
      (msg.includes('settings') ||
       msg.includes('profile picture') ||
       msg.includes('change password') ||
       msg.includes('hibernate') ||
       msg.includes('theme') ||
       msg.includes('dark mode'))
    ) {
      return [
        { label: '⚙️ Go to Settings', value: 'go_settings', action: 'navigate:/settings' },
        { label: '❓ More questions', value: 'I have more questions' },
      ];
    }

    // Videos
    if (
      phase === 'conversation' &&
      (msg.includes('video') ||
       msg.includes('watch') ||
       msg.includes('youtube') ||
       msg.includes('vlog'))
    ) {
      return [
        { label: '🎥 Browse Videos', value: 'browse_videos', action: 'navigate:/videos' },
        { label: '❓ More questions', value: 'I have more questions' },
      ];
    }

    // Dashboard related for mentee
    if (
      phase === 'conversation' &&
      userRole === 'mentee' &&
      (msg.includes('dashboard') ||
       msg.includes('my booking') ||
       msg.includes('upcoming') ||
       msg.includes('past session') ||
       msg.includes('payment history') ||
       msg.includes('cancel'))
    ) {
      return [
        { label: '📋 Go to Dashboard', value: 'go_dashboard', action: 'navigate:/dashboard/mentee' },
        { label: '❓ More questions', value: 'I have more questions' },
      ];
    }

    // Dashboard related for mentor
    if (
      phase === 'conversation' &&
      userRole === 'mentor' &&
      (msg.includes('dashboard') ||
       msg.includes('my booking') ||
       msg.includes('session') ||
       msg.includes('mentee'))
    ) {
      return [
        { label: '📋 Go to Dashboard', value: 'go_dashboard', action: 'navigate:/dashboard/mentor' },
        { label: '❓ More questions', value: 'I have more questions' },
      ];
    }

    // Verification
    if (
      phase === 'conversation' &&
      userRole === 'mentor' &&
      (msg.includes('verif') ||
       msg.includes('badge') ||
       msg.includes('verified'))
    ) {
      return [
        { label: '📋 Go to Dashboard', value: 'go_dashboard', action: 'navigate:/dashboard/mentor' },
        { label: '📅 Set Availability', value: 'How do I set my availability?' },
        { label: '🎓 Add Education', value: 'How do I add my education?' },
        { label: '❓ More questions', value: 'I have more questions' },
      ];
    }

    // Review related
    if (
      phase === 'conversation' &&
      userRole === 'mentee' &&
      (msg.includes('review') ||
       msg.includes('rating') ||
       msg.includes('feedback'))
    ) {
      return [
        { label: '📋 Go to Dashboard', value: 'go_dashboard', action: 'navigate:/dashboard/mentee' },
        { label: '❓ More questions', value: 'I have more questions' },
      ];
    }

    // Default conversation buttons — always show something
    if (phase === 'conversation') {
      if (userRole === 'mentor') {
        return [
          { label: '📅 Availability', value: 'How do I set my availability?' },
          { label: '💵 Pricing', value: 'How do I set my pricing?' },
          { label: '✅ Verification', value: 'How do I get verified?' },
          { label: '📋 Bookings', value: 'How do I manage my bookings?' },
        ];
      } else {
        return [
          { label: '🔍 Browse mentors', value: 'browse_all', action: 'navigate:/mentors' },
          { label: '💬 Recommend a mentor', value: 'Can you recommend a mentor for me?' },
          { label: '📅 How to book', value: 'How do I book a session?' },
          { label: '❓ How it works', value: 'How does GuideMe work?' },
        ];
      }
    }

    return [];
  }

  async function handleSend(overrideText?: string) {
    const trimmed = (overrideText || input).trim();
    if (!trimmed || loading || !sessionId) return;

    // Handle navigation actions
    if (trimmed.startsWith('navigate:')) {
      const path = trimmed.replace('navigate:', '');
      navigate({ to: path as any });
      setQuickReplies([]);
      return;
    }

    setInput('');
    setQuickReplies([]);

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

      // Generate quick reply buttons based on bot response
      const replies = getQuickReplies(
        newPhase,
        botReply,
        userProfile?.role || 'mentee'
      );
      setQuickReplies(replies);

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

            {/* Quick Reply Buttons */}
            {!loading && quickReplies.length > 0 && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                padding: '4px 0 8px',
              }}>
                {quickReplies.map((qr, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (qr.action) {
                        if (qr.action.startsWith('navigate:')) {
                          const path = qr.action.replace('navigate:', '');
                          navigate({ to: path as any });
                          setQuickReplies([]);
                        }
                      } else {
                        handleSend(qr.value);
                      }
                    }}
                    style={{
                      background: 'white',
                      border: '1.5px solid #4F46E5',
                      borderRadius: 20,
                      padding: '5px 12px',
                      fontSize: 12,
                      color: '#4F46E5',
                      cursor: 'pointer',
                      fontWeight: 500,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLButtonElement).style.background = '#4F46E5';
                      (e.target as HTMLButtonElement).style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLButtonElement).style.background = 'white';
                      (e.target as HTMLButtonElement).style.color = '#4F46E5';
                    }}
                  >
                    {qr.label}
                  </button>
                ))}
              </div>
            )}

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