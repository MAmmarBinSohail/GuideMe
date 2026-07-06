export interface Mentor {
  id: string;
  name: string;
  title: string;
  /** DB slug — must be one of MENTOR_CATEGORIES.slug values. */
  category: string;
  rating: number;
  reviews: number;
  pricePerHour: number;
  followupPrice: number;
  freeFirstSession: boolean;
  bio: string;
  avatar: string;
  tags: string[];
  expertiseAreas: string[];
  /** True when the mentor has submitted (and passed) the verification form. */
  verified: boolean;
  yearsOfExperience?: number;
  sessionLanguage?: "english" | "urdu" | "both";
  portfolioUrl?: string;
}

export interface Session {
  id: string;
  mentorId?: string;
  mentorName: string;
  mentorAvatar: string;
  menteeName?: string;
  menteeAvatar?: string;
  topic: string;
  date: string;
  time: string;
  durationMinutes: number;
  status: "upcoming" | "completed" | "pending";
  price: number;
  hasReview?: boolean;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const avatar = (seed: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;

export const MOCK_MENTORS: Mentor[] = [
  {
    id: "m1",
    name: "Ayesha Khan",
    title: "Senior Product Designer @ Figma",
    category: "creative",
    rating: 4.9,
    reviews: 128,
    pricePerHour: 65,
    followupPrice: 50,
    freeFirstSession: true,
    bio: "Helping designers level up their craft, portfolio, and interview prep.",
    avatar: avatar("Ayesha Khan"),
    tags: ["UX", "Portfolio", "Figma"],
    expertiseAreas: ["UX Design", "Product Design", "Portfolio Review"],
    verified: true,
  },
  {
    id: "m2",
    name: "Daniyal Ahmed",
    title: "Staff Engineer @ Google",
    category: "technology",
    rating: 4.8,
    reviews: 96,
    pricePerHour: 90,
    followupPrice: 75,
    freeFirstSession: false,
    bio: "System design, FAANG interviews, and career growth for engineers.",
    avatar: avatar("Daniyal Ahmed"),
    tags: ["System Design", "FAANG", "Leadership"],
    expertiseAreas: ["System Design", "Backend", "Interviews"],
    verified: true,
  },
  {
    id: "m3",
    name: "Sara Iqbal",
    title: "Startup Founder & Business Coach",
    category: "business",
    rating: 4.7,
    reviews: 74,
    pricePerHour: 75,
    followupPrice: 60,
    freeFirstSession: true,
    bio: "From idea to launch — fundraising, GTM strategy, and operations.",
    avatar: avatar("Sara Iqbal"),
    tags: ["Startups", "Fundraising", "GTM"],
    expertiseAreas: ["Startups", "Fundraising", "Operations"],
    verified: true,
  },
  {
    id: "m4",
    name: "Omar Siddiqui",
    title: "Life Coach & Mindfulness Mentor",
    category: "personal",
    rating: 4.9,
    reviews: 211,
    pricePerHour: 40,
    followupPrice: 30,
    freeFirstSession: true,
    bio: "Clarity, focus and confidence — for students and young professionals.",
    avatar: avatar("Omar Siddiqui"),
    tags: ["Mindset", "Habits", "Clarity"],
    expertiseAreas: ["Mindfulness", "Focus", "Habit Building"],
    verified: true,
  },
  {
    id: "m5",
    name: "Hina Raza",
    title: "Data Scientist @ Meta",
    category: "technology",
    rating: 4.8,
    reviews: 64,
    pricePerHour: 80,
    followupPrice: 65,
    freeFirstSession: false,
    bio: "Breaking into data science — projects, interviews, and case studies.",
    avatar: avatar("Hina Raza"),
    tags: ["ML", "Python", "Interviews"],
    expertiseAreas: ["Data Science", "Machine Learning", "Python"],
    verified: true,
  },
  {
    id: "m6",
    name: "Bilal Tariq",
    title: "Career Counselor",
    category: "career",
    rating: 4.6,
    reviews: 142,
    pricePerHour: 35,
    followupPrice: 25,
    freeFirstSession: true,
    bio: "Helping fresh graduates pick the right path with confidence.",
    avatar: avatar("Bilal Tariq"),
    tags: ["Career", "Resume", "Coaching"],
    expertiseAreas: ["Career Planning", "Resume Review", "Interview Prep"],
    verified: false,
  },
  {
    id: "m7",
    name: "Mariam Yousaf",
    title: "Academic Advisor — CS @ PUCIT",
    category: "academic",
    rating: 4.9,
    reviews: 53,
    pricePerHour: 25,
    followupPrice: 20,
    freeFirstSession: true,
    bio: "Thesis guidance, scholarships, and study abroad applications.",
    avatar: avatar("Mariam Yousaf"),
    tags: ["Thesis", "Scholarships", "GRE"],
    expertiseAreas: ["Thesis Writing", "Scholarships", "Study Abroad"],
    verified: true,
  },
  {
    id: "m8",
    name: "Hassan Ali",
    title: "Engineering Leader & Mentor",
    category: "leadership",
    rating: 4.7,
    reviews: 88,
    pricePerHour: 110,
    followupPrice: 90,
    freeFirstSession: false,
    bio: "From IC to manager — leading teams with clarity and empathy.",
    avatar: avatar("Hassan Ali"),
    tags: ["Management", "Hiring", "1:1s"],
    expertiseAreas: ["People Management", "Hiring", "Strategy"],
    verified: true,
  },
  {
    id: "m9",
    name: "Dr. Nadia Aslam",
    title: "Clinical Psychologist",
    category: "health",
    rating: 4.9,
    reviews: 167,
    pricePerHour: 70,
    followupPrice: 55,
    freeFirstSession: false,
    bio: "Stress, anxiety, and wellness coaching for students and professionals.",
    avatar: avatar("Nadia Aslam"),
    tags: ["Mental Health", "Stress", "Wellness"],
    expertiseAreas: ["Mental Wellness", "Stress Management", "Therapy"],
    verified: true,
  },
  {
    id: "m10",
    name: "Usman Hassan",
    title: "CFA — Investment Advisor",
    category: "finance",
    rating: 4.6,
    reviews: 41,
    pricePerHour: 95,
    followupPrice: 80,
    freeFirstSession: false,
    bio: "Personal finance, investing, and long-term wealth planning.",
    avatar: avatar("Usman Hassan"),
    tags: ["Investing", "Budgeting", "Planning"],
    expertiseAreas: ["Investing", "Personal Finance", "Retirement"],
    verified: false,
  },
  {
    id: "m11",
    name: "Adv. Zoya Mirza",
    title: "Corporate Lawyer",
    category: "legal",
    rating: 4.7,
    reviews: 29,
    pricePerHour: 120,
    followupPrice: 100,
    freeFirstSession: false,
    bio: "Contracts, IP, and compliance guidance for founders and freelancers.",
    avatar: avatar("Zoya Mirza"),
    tags: ["Contracts", "IP", "Compliance"],
    expertiseAreas: ["Contracts", "Intellectual Property", "Compliance"],
    verified: false,
  },
  {
    id: "m12",
    name: "Faisal Rehman",
    title: "Communication Coach",
    category: "language",
    rating: 4.8,
    reviews: 76,
    pricePerHour: 45,
    followupPrice: 35,
    freeFirstSession: true,
    bio: "Public speaking, business English, and persuasive writing.",
    avatar: avatar("Faisal Rehman"),
    tags: ["Public Speaking", "English", "Writing"],
    expertiseAreas: ["Public Speaking", "Business English", "Writing"],
    verified: true,
  },
  {
    id: "m13",
    name: "Engr. Tahir Shah",
    title: "Mechanical Engineering Lead",
    category: "engineering",
    rating: 4.7,
    reviews: 38,
    pricePerHour: 60,
    followupPrice: 50,
    freeFirstSession: false,
    bio: "Mentoring engineers on FYP, CAD workflows, and industry transition.",
    avatar: avatar("Tahir Shah"),
    tags: ["CAD", "FYP", "Industry"],
    expertiseAreas: ["Mechanical Design", "CAD", "FYP Guidance"],
    verified: false,
  },
];

export const MOCK_UPCOMING_SESSIONS: Session[] = [
  {
    id: "s1",
    mentorId: "m1",
    mentorName: "Ayesha Khan",
    mentorAvatar: avatar("Ayesha Khan"),
    topic: "Portfolio review for product design role",
    date: "Jun 5, 2026",
    time: "4:00 PM",
    durationMinutes: 45,
    status: "upcoming",
    price: 65,
  },
  {
    id: "s2",
    mentorId: "m2",
    mentorName: "Daniyal Ahmed",
    mentorAvatar: avatar("Daniyal Ahmed"),
    topic: "System design mock interview",
    date: "Jun 8, 2026",
    time: "7:30 PM",
    durationMinutes: 60,
    status: "upcoming",
    price: 90,
  },
];

export const MOCK_PAST_SESSIONS: Session[] = [
  {
    id: "s3",
    mentorId: "m4",
    mentorName: "Omar Siddiqui",
    mentorAvatar: avatar("Omar Siddiqui"),
    topic: "Building a focus routine",
    date: "May 22, 2026",
    time: "6:00 PM",
    durationMinutes: 30,
    status: "completed",
    price: 40,
    hasReview: false,
  },
  {
    id: "s4",
    mentorId: "m6",
    mentorName: "Bilal Tariq",
    mentorAvatar: avatar("Bilal Tariq"),
    topic: "Career path discussion — CS grad",
    date: "May 14, 2026",
    time: "5:00 PM",
    durationMinutes: 45,
    status: "completed",
    price: 35,
    hasReview: true,
  },
];

export const MOCK_MENTOR_SCHEDULE: Session[] = [
  {
    id: "ms1",
    mentorName: "You",
    mentorAvatar: avatar("Mentor"),
    menteeName: "Zain Malik",
    menteeAvatar: avatar("Zain Malik"),
    topic: "Frontend career roadmap",
    date: "Jun 3, 2026",
    time: "3:00 PM",
    durationMinutes: 45,
    status: "upcoming",
    price: 60,
  },
  {
    id: "ms2",
    mentorName: "You",
    mentorAvatar: avatar("Mentor"),
    menteeName: "Fatima Noor",
    menteeAvatar: avatar("Fatima Noor"),
    topic: "Mock interview — React",
    date: "Jun 6, 2026",
    time: "5:30 PM",
    durationMinutes: 60,
    status: "upcoming",
    price: 75,
  },
];

export const MOCK_MENTOR_REQUESTS: Session[] = [
  {
    id: "r1",
    mentorName: "You",
    mentorAvatar: avatar("Mentor"),
    menteeName: "Ali Hamza",
    menteeAvatar: avatar("Ali Hamza"),
    topic: "Resume review for internship",
    date: "Jun 10, 2026",
    time: "8:00 PM",
    durationMinutes: 30,
    status: "pending",
    price: 30,
  },
  {
    id: "r2",
    mentorName: "You",
    mentorAvatar: avatar("Mentor"),
    menteeName: "Hira Shah",
    menteeAvatar: avatar("Hira Shah"),
    topic: "Career switch into UX",
    date: "Jun 12, 2026",
    time: "6:00 PM",
    durationMinutes: 45,
    status: "pending",
    price: 45,
  },
];

export const MOCK_AI_MESSAGES: ChatMessage[] = [
  {
    role: "assistant",
    content:
      "Hi! I'm Mr.Guy-de 👋 Tell me a bit about your goals and I'll suggest mentors and a learning path.",
  },
  {
    role: "user",
    content: "I'm a CS student. I want to break into product design.",
  },
  {
    role: "assistant",
    content:
      "Great choice! Start by building a small portfolio (2–3 projects). I'd recommend booking a session with Ayesha Khan — she specializes in helping engineers transition into design.",
  },
];
