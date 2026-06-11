// Mock mentee profiles for the preview.
// Privacy rule: by default, mentee profile is visible only to mentors they've booked.
// If `isPublic` is true (mentee opted in via Settings), any mentor can view.

export interface MenteeProfile {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  goals: string[];
  joinedYear: number;
  isPublic: boolean;
}

const avatar = (seed: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;

export const MOCK_MENTEES: MenteeProfile[] = [
  {
    id: "u1",
    name: "Zain Malik",
    avatar: avatar("Zain Malik"),
    bio: "Final-year CS student exploring frontend & UX.",
    goals: ["Land a frontend internship", "Build a strong portfolio"],
    joinedYear: 2024,
    isPublic: true,
  },
  {
    id: "u2",
    name: "Fatima Noor",
    avatar: avatar("Fatima Noor"),
    bio: "Self-taught developer prepping for React interviews.",
    goals: ["Master React patterns", "Crack FAANG screening"],
    joinedYear: 2025,
    isPublic: false,
  },
  {
    id: "u3",
    name: "Ali Hamza",
    avatar: avatar("Ali Hamza"),
    bio: "Looking to switch from civil engineering to product management.",
    goals: ["Career pivot", "Resume review"],
    joinedYear: 2026,
    isPublic: false,
  },
  {
    id: "u4",
    name: "Hira Shah",
    avatar: avatar("Hira Shah"),
    bio: "Designer trying to break into UX research.",
    goals: ["Portfolio feedback", "UX research basics"],
    joinedYear: 2025,
    isPublic: true,
  },
];

export const getMentee = (id: string) => MOCK_MENTEES.find((m) => m.id === id);

// Map mentee names from the mentor dashboard mock data to mentee ids.
export const MENTEE_NAME_TO_ID: Record<string, string> = {
  "Zain Malik": "u1",
  "Fatima Noor": "u2",
  "Ali Hamza": "u3",
  "Hira Shah": "u4",
};
