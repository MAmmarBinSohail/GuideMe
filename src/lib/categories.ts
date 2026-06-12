import {
  GraduationCap,
  Briefcase,
  Building2,
  Cpu,
  HeartPulse,
  Sparkles,
  Palette,
  TrendingUp,
  Scale,
  Users,
  Languages,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/**
 * Mentor categories.
 * `slug` matches the DB CHECK constraint values exactly:
 *   academic, career, business, technology, health, personal,
 *   creative, finance, legal, leadership, language, engineering
 */
export interface MentorCategory {
  slug: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
}

export const MENTOR_CATEGORIES: MentorCategory[] = [
  {
    slug: "academic",
    label: "Academic & Education",
    shortLabel: "Academic",
    description: "Studies, scholarships, theses & exam prep.",
    icon: GraduationCap,
  },
  {
    slug: "career",
    label: "Career & Professional Development",
    shortLabel: "Career",
    description: "Job hunting, interviews & career switches.",
    icon: Briefcase,
  },
  {
    slug: "business",
    label: "Business & Entrepreneurship",
    shortLabel: "Business",
    description: "Startups, growth, sales & operations.",
    icon: Building2,
  },
  {
    slug: "technology",
    label: "Technology & IT",
    shortLabel: "Technology",
    description: "Software, data, cloud & cyber security.",
    icon: Cpu,
  },
  {
    slug: "health",
    label: "Health & Wellness",
    shortLabel: "Health",
    description: "Fitness, nutrition & mental well-being.",
    icon: HeartPulse,
  },
  {
    slug: "personal",
    label: "Personal Development",
    shortLabel: "Personal",
    description: "Habits, confidence, focus & life clarity.",
    icon: Sparkles,
  },
  {
    slug: "creative",
    label: "Creative Arts & Design",
    shortLabel: "Creative",
    description: "Design, writing, music & visual arts.",
    icon: Palette,
  },
  {
    slug: "finance",
    label: "Finance & Investment",
    shortLabel: "Finance",
    description: "Budgeting, investing & financial planning.",
    icon: TrendingUp,
  },
  {
    slug: "legal",
    label: "Legal & Compliance",
    shortLabel: "Legal",
    description: "Contracts, IP, compliance & policy.",
    icon: Scale,
  },
  {
    slug: "leadership",
    label: "Leadership & Management",
    shortLabel: "Leadership",
    description: "Team building, management & strategy.",
    icon: Users,
  },
  {
    slug: "language",
    label: "Language & Communication",
    shortLabel: "Language",
    description: "Public speaking, writing & languages.",
    icon: Languages,
  },
  {
    slug: "engineering",
    label: "Engineering & Sciences",
    shortLabel: "Engineering",
    description: "Mechanical, electrical, civil & research.",
    icon: Wrench,
  },
];

export const CATEGORY_BY_SLUG: Record<string, MentorCategory> =
  Object.fromEntries(MENTOR_CATEGORIES.map((c) => [c.slug, c]));

export function getCategory(slug: string): MentorCategory | undefined {
  return CATEGORY_BY_SLUG[slug];
}
