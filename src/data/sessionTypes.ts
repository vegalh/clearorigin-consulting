import type { SessionType } from '@/types';

/**
 * Schedulable lesson formats — the booking engine only needs an id and a
 * duration. Products (titles, prices, packages) live in `courses.ts` and point
 * at these by id.
 */
export const demoSessionTypes: SessionType[] = [
  {
    id: 'trial-30',
    name: 'Trial Lesson',
    durationMinutes: 30,
    description: 'A first lesson to meet an instructor and experience the teaching approach.',
  },
  {
    id: 'lesson-30',
    name: '30-minute Lesson',
    durationMinutes: 30,
    description: 'A focused one-on-one Chinese lesson.',
  },
  {
    id: 'lesson-45',
    name: '45-minute Lesson',
    durationMinutes: 45,
    description: 'A one-on-one Chinese lesson with time for practice and review.',
  },
  {
    id: 'lesson-60',
    name: '60-minute Lesson',
    durationMinutes: 60,
    description: 'A full one-on-one Chinese lesson for deeper practice.',
  },

  // --- v1 formats: kept only so bookings saved by v1 still resolve ---------------
  {
    id: 'discovery-conversation',
    name: 'Discovery Conversation',
    durationMinutes: 15,
    description: 'A short, no-pressure intro call to meet your instructor and talk about your goals.',
    demoPriceUsd: 0,
    legacy: true,
  },
  {
    id: 'conversation-practice',
    name: 'Conversation Practice',
    durationMinutes: 30,
    description: 'Focused speaking practice built around your interests and everyday situations.',
    demoPriceUsd: 18,
    legacy: true,
  },
  {
    id: 'personalized-session',
    name: 'Personalized Session',
    durationMinutes: 45,
    description: 'A tailored session combining structured guidance with open conversation.',
    demoPriceUsd: 26,
    legacy: true,
  },
  {
    id: 'extended-conversation',
    name: 'Extended Conversation',
    durationMinutes: 60,
    description: 'A full session for deeper practice, review, and extended discussion.',
    demoPriceUsd: 34,
    legacy: true,
  },
];

export const getSessionTypeById = (id: string): SessionType | undefined =>
  demoSessionTypes.find((sessionType) => sessionType.id === id);
