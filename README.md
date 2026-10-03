# GuideMe — A Smart Online Counseling & Mentorship Marketplace

> A Final Year Project by Department of Software Engineering, PUCIT, University of the Punjab, Lahore.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-guideme--theta.vercel.app-4F46E5?style=for-the-badge)](https://guideme-theta.vercel.app)
[![GitHub Release](https://img.shields.io/badge/Release-v2.0.3-success?style=for-the-badge)](https://github.com/MAmmarBinSohail/GuideMe/releases/tag/v2.0.3)

A full-stack web application connecting students and individuals with verified expert mentors across **12 categories**: Academic, Career, Business, Technology, Health, Personal, Creative, Finance, Legal, Leadership, Language, and Engineering.

---

## 👥 Project Information

| Field | Details |
|-------|---------|
| Institution | University of the Punjab, Lahore (PUCIT) |
| Department | Software Engineering (2022–2026) |
| Supervisor | Dr. Mufassra Naz, Assistant Professor |
| Student 1 | M. Usman Hassan — BSEF22M010 |
| Student 2 | M. Ammar Bin Sohail — BSEF22M056 |

---

## 🚀 Live Demo

**URL:** https://guideme-theta.vercel.app

### Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Mentee | bsef22m056@pucit.edu.pk | mentee123 |
| Mentor (Academic) | mentor1@example.com | mentor123 |
| Mentor (Career) | mentor2@example.com | mentor123 |
| Mentor (Health) | mentor3@example.com | mentor123 |
| Admin | binsohail2002@gmail.com | admin@123 |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Backend | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| AI Chatbot | Groq API (`openai/gpt-oss-20b`) |
| Meeting Links | Jitsi Meet (auto-generated per booking) |
| Email | Google Apps Script via Supabase Edge Function |
| Deployment | Vercel (frontend) + Supabase Cloud (backend) |

---

## ✨ Key Features

### For Mentees
- 🔍 Browse verified mentors across 12 categories with search and filters
- 📋 Rich mentor profiles — bio, education, experience, certifications, and videos
- 📅 Book sessions with flexible durations (30 min to 3 hrs) in **PKT timezone**
- 🎁 Free first session per mentor-mentee pair (if mentor enables it)
- 💳 Payment methods: JazzCash, Easypaisa, Bank Transfer, Wise/Payoneer
- 📊 Dashboard with Upcoming, Past, Cancelled, and Payments tabs
- ⭐ Leave star ratings and written reviews after completed sessions
- 🔔 Email and in-app notifications for all booking events

### For Mentors
- 👤 Complete profile with Basic Info, Education, Experience, and Certifications
- 🗓 Recurring weekly availability with multiple time blocks per day (PKT)
- 💰 Multi-tier pricing: initial, follow-up, and overage rate per minute
- 🎥 Add YouTube and Google Drive videos (verified mentors only)
- ✅ Mark sessions complete and add overage charges for extended sessions
- ⭐ View all reviews and average rating in dedicated Reviews tab
- 🏅 Automatic verified badge when bio + education + availability complete
- 😴 Hibernation mode to temporarily pause new bookings

### Mr.Guy-de AI Chatbot
- 🤖 Powered by Groq API (`openai/gpt-oss-20b`) — fast, reliable, free tier
- 🎯 Role-aware onboarding with clickable category buttons
- 👥 Real-time mentor recommendations fetched from database by name
- 💬 Contextual quick-reply buttons after every response
- 🔗 Hash-based navigation — buttons open specific dashboard tabs directly
- 📱 Floating widget + full page — accessible from anywhere in the app

### Admin Panel
- 📊 Platform stats: users, bookings, revenue with 10% commission breakdown
- ✅ Verify or unverify mentors with one click
- 🔒 Block or unblock users
- 👑 Change the role of any user
- 🗑 Delete inappropriate videos and reviews with automatic rating recalculation
- 📧 Send newsletter to all active subscribers via Gmail
- 👥 View and manage subscriber list

---

## 🗄 Database Schema

| Item | Count |
|------|-------|
| Tables | 16 with full Row Level Security |
| SQL Functions | 4 |
| Database Triggers | 6 |
| Schema File | `/docs/schema.sql` |

**SQL Functions:**
- `check_booking_overlap()` — prevents double bookings
- `get_available_start_times()` — returns valid 30-min or more PKT slots
- `is_eligible_for_free_session()` — checks free session eligibility
- `check_mentor_verification()` — auto-verifies mentor on profile completion

---

## 💰 Commission Model

- Platform commission: **10%** of each session payment
- Mentor payout: **90%** of each session payment
- All payments are simulated — demo platform, no real transactions occur

---

## 🕐 Time Zone

All times across the platform are in **Pakistan Standard Time (PKT, UTC+5)**.  
GuideMe is designed for Pakistani mentees. International mentors are welcome with availability managed in PKT.

---

## ⚙️ Local Installation

### Prerequisites
- Node.js v18+, npm v9+, Git
- Supabase account (free at supabase.com)
- Groq API account (free at console.groq.com)
- Google account (for Apps Script email service)
- Supabase CLI: `npm install -g supabase`

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/MAmmarBinSohail/GuideMe.git
cd GuideMe

# 2. Install dependencies
npm install

# 3. Create .env file
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GROQ_API_KEY=your_groq_api_key

# 4. Set up database
# Run /docs/schema.sql in Supabase SQL Editor

# 5. Deploy Edge Function
supabase login
supabase link --project-ref your-project-ref
supabase secrets set GOOGLE_SCRIPT_URL=your_apps_script_url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
supabase functions deploy send-email --no-verify-jwt
supabase functions deploy admin-actions --no-verify-jwt

# 6. Start development server
npm run dev
# Opens at http://localhost:8080
```

---

## 🏗 Project Structure

```
src/
├── App.tsx                     # Routes and app wrapper
├── supabaseClient.js           # Supabase client
├── chatbot/
│   ├── ChatbotWidget.tsx       # Floating chatbot widget
│   ├── chatbotService.ts       # Session management
│   ├── groqService.ts          # Groq API integration
│   ├── guidemeDocumentation.ts # Platform docs for AI context
│   └── systemPrompt.ts         # Role-aware system prompts
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx          # Navigation bar
│   │   └── Footer.tsx          # Footer with newsletter subscribe
│   └── ProtectedRoute.tsx      # Route guard by role
├── contexts/
│   ├── AuthContext.tsx         # Authentication state
│   └── ThemeContext.tsx        # Dark/light theme
├── lib/
│   ├── categories.ts           # Mentor category definitions
│   ├── dateUtils.ts            # PKT date/time formatters
│   ├── emailService.ts         # Email via Edge Function
│   └── notificationHelper.ts  # Notification creation helper
└── routes/
    ├── index.tsx               # Home page with trending mentors
    ├── mentors.tsx             # Mentor marketplace
    ├── mentors_.$id.tsx        # Mentor public profile
    ├── book.$mentorId.tsx      # Booking and payment flow
    ├── videos.tsx              # Public videos page
    ├── ai-assistant.tsx        # Mr.Guy-de full page
    ├── dashboard.mentee.tsx    # Mentee dashboard
    ├── dashboard.mentor.tsx    # Mentor dashboard
    ├── dashboard.admin.tsx     # Admin panel
    ├── settings.tsx            # User settings
    ├── login.tsx               # Login page
    ├── register.tsx            # Registration page
    ├── privacy-policy.tsx      # Privacy policy
    ├── terms-of-service.tsx    # Terms of service
    └── unsubscribe.tsx         # Email unsubscribe

supabase/
└── functions/
    └── send-email/             # Email via Google Apps Script
```

---

## 📁 Mentorship Categories

| Category | Description |
|----------|-------------|
| Academic | University, exams, thesis, entry tests |
| Career | Job hunting, CV, interviews, career switch |
| Business | Startups, entrepreneurship, strategy |
| Technology | Programming, software, data science |
| Health | Nutrition, fitness, physiotherapy, wellness |
| Personal | Mindfulness, productivity, habit building |
| Creative | Design, video, content creation |
| Finance | Investing, budgeting, financial literacy |
| Legal | Law, documentation, legal advice |
| Leadership | Management, team building, coaching |
| Language | English, IELTS, spoken communication |
| Engineering | Mechanical, civil, electrical engineering |

---

## 🔄 CI/CD Pipeline

- **Trigger:** Push to `main` branch
- **Platform:** Vercel GitHub Integration
- **Steps:** Checkout → `npm install` → `npm run build` → Deploy to global CDN
- **Build Time:** ~45 seconds
- **Rollback:** Automatic — previous deployment kept as fallback

---

## 📄 License

This project is developed for academic purposes as a Final Year Project at PUCIT, University of the Punjab. All rights reserved.

---

## 📬 Contact

**GuideMe Team**  
PUCIT, University of the Punjab, Lahore, Pakistan  
Email: bsef22m056@pucit.edu.pk

*Supervised by Dr. Mufassra Naz, Assistant Professor, Department of Software Engineering*