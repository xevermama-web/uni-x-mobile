/**
 * Utility functions for parsing routine times and calculating class statuses
 * according to real-time Asia/Dhaka timezone.
 */

/**
 * Parses a time string like "09:00 AM", "10:30 AM", "1:00 PM", "14:00" into total minutes from 00:00 (midnight).
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const str = timeStr.trim().toUpperCase();

  // Match e.g. "09:30 AM", "9:30AM", "14:30", "9:30"
  const match = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const modifier = match[3];

    if (modifier) {
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
    } else {
      if (hours === 24) hours = 0;
    }
    return hours * 60 + minutes;
  }
  return 0;
}

/**
 * Returns current minutes since midnight in Asia/Dhaka timezone.
 */
export function getDhakaCurrentMinutes(): number {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dhaka',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  }).formatToParts(now);

  let hours = 0;
  let minutes = 0;
  for (const part of parts) {
    if (part.type === 'hour') hours = parseInt(part.value, 10);
    if (part.type === 'minute') minutes = parseInt(part.value, 10);
  }
  if (hours === 24) hours = 0;
  return hours * 60 + minutes;
}

/**
 * Returns current day of week in Asia/Dhaka timezone (e.g. "Saturday", "Sunday", "Monday").
 */
export function getDhakaDayOfWeek(): string {
  return new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Dhaka', weekday: 'long' });
}

export type ClassStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED';

/**
 * Determines class status based on Asia/Dhaka current time vs class start & end times.
 * - If current time is before Start Time -> 'UPCOMING'
 * - If current time >= Start Time AND < End Time -> 'ONGOING'
 * - If current time >= End Time -> 'COMPLETED'
 */
export function getClassStatus(
  startTimeStr: string,
  endTimeStr: string,
  currentDhakaMinutes: number
): ClassStatus {
  const startMins = parseTimeToMinutes(startTimeStr);
  const endMins = parseTimeToMinutes(endTimeStr);

  if (currentDhakaMinutes < startMins) {
    return 'UPCOMING';
  } else if (currentDhakaMinutes >= startMins && currentDhakaMinutes < endMins) {
    return 'ONGOING';
  } else {
    return 'COMPLETED';
  }
}
