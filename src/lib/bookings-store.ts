// Simple in-memory mock store for slot bookings during preview.
// Real implementation will use the `bookings` table.
import { useSyncExternalStore } from "react";

type BookingKey = string; // `${mentorId}:${slotId}`

const booked = new Set<BookingKey>();
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function isSlotBooked(mentorId: string, slotId: string) {
  return booked.has(`${mentorId}:${slotId}`);
}

export function bookSlot(mentorId: string, slotId: string) {
  const key = `${mentorId}:${slotId}`;
  if (booked.has(key)) return false;
  booked.add(key);
  emit();
  return true;
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function snapshot() {
  return booked.size; // primitive trigger
}

export function useBookings() {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

// Generate deterministic mock availability for a mentor.
export interface AvailabilitySlot {
  id: string;
  date: string; // ISO yyyy-mm-dd
  startTime: string; // HH:mm
  endTime: string;
  durationMinutes: number;
  preBooked: boolean; // initially taken (independent of in-session bookings)
}

export function getMentorAvailability(mentorId: string): AvailabilitySlot[] {
  const slots: AvailabilitySlot[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  // Deterministic seed based on mentor id
  const seed = mentorId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const times: Array<[string, string, number]> = [
    ["10:00", "11:00", 60],
    ["13:00", "13:45", 45],
    ["16:00", "16:30", 30],
    ["18:30", "19:30", 60],
  ];
  for (let d = 1; d <= 14; d++) {
    const day = new Date(start);
    day.setDate(day.getDate() + d);
    const iso = day.toISOString().slice(0, 10);
    // Skip some days to make availability sparse
    if ((seed + d) % 3 === 0) continue;
    times.forEach(([s, e, dur], idx) => {
      if ((seed + d + idx) % 5 === 0) return; // skip some times
      const id = `${iso}-${s.replace(":", "")}`;
      slots.push({
        id,
        date: iso,
        startTime: s,
        endTime: e,
        durationMinutes: dur,
        preBooked: (seed + d * 7 + idx) % 6 === 0,
      });
    });
  }
  return slots;
}
