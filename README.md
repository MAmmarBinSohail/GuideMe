# GuideMe — A Smart Online Counseling & Mentorship Marketplace

A full-stack web application connecting students and individuals
with verified expert mentors across 12 categories including
Academic, Career, Business, Technology, Health, Personal,
Creative, Finance, Legal, Leadership, Language, and Engineering.

Live Demo: https://guideme-theta.vercel.app

---

Project Info:
  Institution: University of the Punjab, Lahore (PUCIT)
  Department: Software Engineering (2022-2026)
  Supervised by: Dr. Mufassra Naz, Assistant Professor
  Team:
    M.Usman Hassan (BSEF22M010)
    M.Ammar Bin Sohail (BSEF22M056)

---

Tech Stack:
  Frontend: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
  Backend: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
  AI Chatbot: Groq API (llama-3.1-8b-instant)
  Meeting Links: Jitsi Meet (auto-generated)
  Email: Google Apps Script via Supabase Edge Function
  Deployment: Vercel

---

Key Features:

For Mentees:
  - Browse verified mentors across 12 categories
  - View rich mentor profiles (bio, education, experience,
    certifications, videos)
  - Book sessions with flexible durations (30 min to 3 hrs)
  - Free first session per mentor (if mentor enables it)
  - Multiple payment methods (JazzCash, Easypaisa,
    Bank Transfer, Wise/Payoneer)
  - Dashboard with Upcoming, Past, Cancelled, Payments tabs
  - Leave star ratings and written reviews after sessions
  - Receive email notifications for all booking events
  - Chat with Mr.Guy-de AI assistant with clickable buttons
    and real-time mentor recommendations

For Mentors:
  - Complete professional profile with Education,
    Experience, Certifications, and Basic Info sections
  - Recurring weekly availability (multiple blocks per day)
  - Multi-tier pricing (initial, followup, overage per minute)
  - Free first session toggle
  - Add YouTube/Google Drive videos (verified mentors only)
  - Mark sessions complete and charge extra time
  - View all reviews and average rating in dashboard
  - Automatic verified badge based on profile completeness
  - Hibernation mode to pause new bookings

Mr.Guy-de AI Chatbot:
  - Powered by Groq AI (Llama 3.1)
  - Role-aware onboarding with clickable category buttons
  - Real-time mentor recommendations from database
  - Contextual quick-reply buttons after every response
  - Hash-based navigation buttons to specific dashboard tabs
  - Shared conversation between widget and full page

---

Database Schema:
  Tables: 16
    profiles, mentor_profiles, mentor_education,
    mentor_experience, mentor_certifications, mentor_videos,
    mentor_weekly_availability, bookings, meetings,
    reviews, payments, notifications,
    notification_preferences, chatbot_sessions,
    chatbot_messages, chatbot_faqs

  SQL Functions: 4
    check_booking_overlap()
    get_available_start_times()
    is_eligible_for_free_session()
    check_mentor_verification()

  Triggers: 6
    on_auth_user_created
    on_education_change
    on_mentor_bio_change
    on_profile_avatar_change
    on_availability_change_verification
    on_weekly_availability_change

---

Local Installation:

  Prerequisites:
    Node.js v18+, npm v9+, Git
    Supabase account, Groq API account

  Steps:
    git clone https://github.com/MAmmarBinSohail/GuideMe.git
    cd GuideMe
    npm install

    Create .env file:
      VITE_SUPABASE_URL=your_url
      VITE_SUPABASE_ANON_KEY=your_key
      VITE_GROQ_API_KEY=your_groq_key

    Run schema: copy /docs/schema.sql to Supabase SQL Editor
    npm run dev → http://localhost:5173

---

## Test Credentials

| Role | Email | Password |
|---|---|---|
| Mentee | bsef22m056@pucit.edu.pk | mentee123 |
| Mentor | mentor1@example.com | mentor123 |
| Mentor | mentor2@example.com | mentor123 |
| Mentor | mentor3@example.com | mentor123 |

---

GitHub: https://github.com/MAmmarBinSohail/GuideMe
Release: v2.0.0
