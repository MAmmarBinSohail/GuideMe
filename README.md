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

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher)
- npm (comes with Node.js)
- A [Supabase](https://supabase.com/) account with a project set up

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root of the project by copying the example:

```bash
cp .env.example .env
```

Then open `.env` and fill in your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

You can find these in your Supabase project under:
**Project Settings → API → Project URL & anon public key**

> ⚠️ Never commit your `.env` file. It is already listed in `.gitignore`.

### 4. Run the Development Server

```bash
npm run dev
```

The app will be available at **http://localhost:8080**.

---

### Notes

- All database tables are already created in the connected Supabase project. No migrations need to be run.
- This project is intended for **local development only** at this stage.
- If you do not have access to the Supabase project, contact the repository owner to get the credentials.

