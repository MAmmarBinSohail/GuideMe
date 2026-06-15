# GuideMe

## Product Vision
A smart online counseling and mentorship marketplace for students and individuals seeking
trusted personal, academic, health, or professional guidance, enabling them to easily
connect with verified experts through a secure booking and communication platform,
making expert mentorship accessible, reliable, and hassle-free regardless of location. The
platform also supports continuous mentorship through follow-up sessions, enabling
long-term guidance and improved user outcomes.

<br><br>
## GitHub Branch Structure
The project source code is managed using GitHub to ensure version control,
collaboration, traceability, and safe deployment practices.
The team will follow a 3-Branch Workflow in github given as below: <br><br>
**● Main Branch:** Stable, finalized production-ready code used for final submission and
demo presentation.<br>
**● Develop Branch:** Latest, Active integrated version used for performing testing, and
verifying functionality.<br>
**● Hotfix Branches:** Problematic code that needs critical bug fixes or urgent issues
found after testing or in the final demo version.<br>
### Branch Protection Rules:<br>
o No direct pushes to main<br>
o All merges via pull request with review<br>
o At least one team member approval<br>
o Commit history must remain clean<br>
o Code must be tested before merging<br>

<br> <br> <br>

<div align="center">

# GuideMe

### *A Smart Online Counseling & Mentorship Marketplace*

**Connect with verified experts. Get guidance that matters.**

---

*FYDP — Department of Software Engineering, PUCIT, University of the Punjab*

**M. Usman Hassan** · **M. Ammar Bin Sohail** · Supervised by **Dr. Mufassra Naz**

</div>

---

## About GuideMe

GuideMe is a smart online counseling and mentorship marketplace built for students and individuals seeking trusted **personal, academic, health, or professional guidance**. The platform enables users to easily connect with verified experts through a secure booking and communication system — making quality mentorship accessible, reliable, and hassle-free regardless of location.

> Users register as a **Mentor** or **Mentee**, browse verified counselors, book sessions, and receive guidance — all in one place.

---

## Features — Sprint 1

| # | Feature | Status |
|---|---------|--------|
|  | **User Authentication** — Register, Login, Logout, Session Persistence, Protected Routes, Forgot & Reset Password | ✅ Complete |
|  | **Mentor & Mentee Profiles** — Role-based profile creation and management | ✅ Complete |
|  | **Mentor Listing** — Browse and filter mentors by category and rating | ✅ Complete |
|  | **AI ChatBot — Mr. Guy-de** — Intelligent assistant to guide users on the platform | ✅ Complete |
|  | **Responsive Landing Page** — Fully responsive across devices | ✅ Complete |
|  | **Dark / Light Mode** — User-controlled theme toggle | ✅ Complete |

---

## Tech Stack

```
┌─────────────────────────────────────────────────┐
│                   GuideMe Stack                  │
├────────────────┬────────────────────────────────┤
│   Frontend     │  React · Vite · HTML · CSS      │
│   Backend      │  Supabase (Auth + API)          │
│   Database     │  PostgreSQL (via Supabase)      │
│   Hosting      │  Local (Cloud planned for D3)   │
└────────────────┴────────────────────────────────┘
```

---

## Getting Started

### Prerequisites

Make sure the following are installed on your machine before proceeding:

- [Node.js](https://nodejs.org/) **v18 or higher**
- **npm** (comes bundled with Node.js)
- A modern web browser (Chrome, Firefox, Edge)
- Supabase credentials *(contact the repository owner — see below)*

---

### Installation

**Step 1 — Clone the repository**

```bash
git clone https://github.com/MAmmarBinSohail/GuideMe
cd GuideMe
```

**Step 2 — Install dependencies**

```bash
npm install
npm install @supabase/supabase-js
```

**Step 3 — Configure environment variables**

Create a `.env` file in the root of the project:

```bash
# On Windows (PowerShell)
echo $null > .env

# On macOS / Linux
touch .env
```

Open `.env` and add your Supabase credentials:

```env
VITE_SUPABASE_URL="your-supabase-project-url"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-public-key"
```

>  **Where to get credentials?**
> You can find these in your Supabase project under **Settings → API → Project URL & anon public key**.
> If you do not have access to the Supabase project, contact the repository owner at:
> **[MAmmarBinSohail on GitHub](https://github.com/MAmmarBinSohail)**

>  **Never commit your `.env` file.** It is already listed in `.gitignore`.

**Step 4 — Run the development server**

```bash
npm run dev
```

You should see output like this in your terminal:

```
> dev
> vite dev

  VITE v7.3.5  ready in 1676 ms

  ➜  Local:   http://localhost:8080/
  ➜  Network: http://192.168.100.14:8080/
  ➜  press h + enter to show help
```

**Step 5 — Open in browser**

Copy the `Local` URL and paste it into your browser:

```
http://localhost:8080/
```

> 📝 The port number may vary (e.g. `5173`, `8080`). Always use the URL shown in your terminal.

---

## Project Structure

```
GuideMe/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   ├── pages/              # Route-level pages (Landing, Login, Dashboard...)
│   ├── lib/                # Supabase client configuration
│   └── main.jsx            # App entry point
├── .env                    # Environment variables (not committed)
├── .env.example            # Example env file (committed)
├── vite.config.js          # Vite configuration
└── package.json
```

---

## Git Branching Strategy

This project follows a **3-Branch Workflow**:

| Branch | Purpose |
|--------|---------|
| `main` | Stable, production-ready code for final submission |
| `develop` | Active integration branch for testing |
| `feature/<name>` | Individual feature development (e.g. `feature/auth-module`) |
| `hotfix/<name>` | Critical bug fixes post-testing |

> All merges to `main` require a **Pull Request** with at least one team member review.

---

## Known Issues & TODOs

- [ ] Google OAuth (Sign in with Google) — *pending Supabase provider config*
- [ ] Full frontend–backend CRUD integration for real-time data
- [ ] AI ChatBot (Mr. Guy-de) — LLM/API integration pending
- [ ] Payment authentication & session pricing
- [ ] Production build (`npm run build`) not yet tested

---

## Team

| Name | Roll No | Role |
|------|---------|------|
| M. Usman Hassan | BSEF22M010 | Backend · Database · Auth Integration |
| M. Ammar Bin Sohail | BSEF22M056 | Frontend · UI/UX · ChatBot Interface |

**Supervised by:** Dr. Mufassra Naz, Assistant Professor, PUCIT

---

## Academic Info

> **FYDP-DSE · Bachelors of Science in Software Engineering (2022–2026)**
> Faculty of Computing and Information Technology (FCIT)
> University of the Punjab, Lahore — Pakistan
> [www.pucit.edu.pk](https://www.pucit.edu.pk) · [fydp.dse@pucit.edu.pk](mailto:fydp.dse@pucit.edu.pk)
