import type { SessionType } from '@/types';

/**
 * Configurable demo session offerings. These are proposed, fictional lesson
 * formats for the prototype — not verified ClearOrigin services or pricing.
 * All instructors reference these by id, so duration/pricing changes only
 * need to happen in this one place.
 */
export const demoSessionTypes: SessionType[] = [
  {
    id: 'discovery-conversation',
    name: 'Discovery Conversation',
    durationMinutes: 15,
    description: 'A short, no-pressure intro call to meet your instructor and talk about your goals.',
    demoPriceUsd: 0,
  },
  {
    id: 'conversation-practice',
    name: 'Conversation Practice',
    durationMinutes: 30,
    description: 'Focused speaking practice built around your interests and everyday situations.',
    demoPriceUsd: 18,
  },
  {
    id: 'personalized-session',
    name: 'Personalized Session',
    durationMinutes: 45,
    description: 'A tailored session combining structured guidance with open conversation.',
    demoPriceUsd: 26,
  },
  {
    id: 'extended-conversation',
    name: 'Extended Conversation',
    durationMinutes: 60,
    description: 'A full session for deeper practice, review, and extended discussion.',
    demoPriceUsd: 34,
  },
];

export const getSessionTypeById = (id: string): SessionType | undefined =>
  demoSessionTypes.find((sessionType) => sessionType.id === id);
