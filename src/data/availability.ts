import type { RecurringAvailability } from '@/types';

/**
 * Weekly recurring availability rules, one set per demo instructor. Times
 * are local wall-clock hours in each instructor's own IANA timezone (see
 * src/data/instructors.ts). Days not listed here are fully unavailable
 * (e.g. Maya Chen has no Wednesday rule, matching the "Wednesday:
 * Unavailable" example in the product brief).
 */
export const demoRecurringAvailability: RecurringAvailability[] = [
  // Maya Chen — America/New_York
  { id: 'maya-mon', instructorId: 'maya-chen', dayOfWeek: 1, startTime: '09:00', endTime: '12:00' },
  { id: 'maya-tue', instructorId: 'maya-chen', dayOfWeek: 2, startTime: '14:00', endTime: '18:00' },
  { id: 'maya-thu', instructorId: 'maya-chen', dayOfWeek: 4, startTime: '10:00', endTime: '16:00' },
  { id: 'maya-fri', instructorId: 'maya-chen', dayOfWeek: 5, startTime: '09:00', endTime: '15:00' },

  // David Okafor — America/Los_Angeles
  { id: 'david-mon', instructorId: 'david-okafor', dayOfWeek: 1, startTime: '08:00', endTime: '11:00' },
  { id: 'david-wed', instructorId: 'david-okafor', dayOfWeek: 3, startTime: '13:00', endTime: '17:00' },
  { id: 'david-thu', instructorId: 'david-okafor', dayOfWeek: 4, startTime: '09:00', endTime: '12:00' },
  { id: 'david-fri', instructorId: 'david-okafor', dayOfWeek: 5, startTime: '13:00', endTime: '17:00' },
  { id: 'david-sat', instructorId: 'david-okafor', dayOfWeek: 6, startTime: '09:00', endTime: '11:00' },

  // Priya Nandakumar — Europe/London
  { id: 'priya-mon', instructorId: 'priya-nandakumar', dayOfWeek: 1, startTime: '09:00', endTime: '13:00' },
  { id: 'priya-tue', instructorId: 'priya-nandakumar', dayOfWeek: 2, startTime: '09:00', endTime: '13:00' },
  { id: 'priya-wed', instructorId: 'priya-nandakumar', dayOfWeek: 3, startTime: '09:00', endTime: '13:00' },
  { id: 'priya-fri', instructorId: 'priya-nandakumar', dayOfWeek: 5, startTime: '09:00', endTime: '12:00' },
  { id: 'priya-sun', instructorId: 'priya-nandakumar', dayOfWeek: 0, startTime: '15:00', endTime: '18:00' },

  // Liang Wu — Asia/Shanghai
  { id: 'liang-tue', instructorId: 'liang-wu', dayOfWeek: 2, startTime: '19:00', endTime: '22:00' },
  { id: 'liang-wed', instructorId: 'liang-wu', dayOfWeek: 3, startTime: '19:00', endTime: '22:00' },
  { id: 'liang-thu', instructorId: 'liang-wu', dayOfWeek: 4, startTime: '19:00', endTime: '22:00' },
  { id: 'liang-fri', instructorId: 'liang-wu', dayOfWeek: 5, startTime: '19:00', endTime: '22:00' },
  { id: 'liang-sat', instructorId: 'liang-wu', dayOfWeek: 6, startTime: '10:00', endTime: '13:00' },
];
