import type { Course } from '@/types';

/**
 * Proposed course catalog. Every title, duration and price here is an
 * illustrative DEMO value awaiting ClearOrigin's approval (`status:
 * 'proposed'`) — not real ClearOrigin pricing. Prices are configured per
 * currency in minor units; a currency without a configured price is simply
 * not offered (the app never converts between currencies).
 */
export const demoCourses: Course[] = [
  {
    id: 'trial-lesson',
    category: 'trial',
    title: 'Trial Lesson',
    description:
      'Meet an instructor, talk through your goals, and experience a short piece of a real lesson before you commit.',
    durationMinutes: 30,
    sessionTypeId: 'trial-30',
    prices: { USD: 1500, CNY: 10000 },
    suitableFor: ['young_learners', 'teenagers', 'adult_beginners', 'heritage', 'conversational'],
    includes: ['A friendly level check', 'A taste of guided conversation', 'A suggested learning path'],
    status: 'proposed',
  },
  {
    id: 'lesson-30',
    category: 'single',
    title: '30-minute Lesson',
    description: 'A focused one-on-one lesson — ideal for young learners or a quick, regular speaking habit.',
    durationMinutes: 30,
    sessionTypeId: 'lesson-30',
    prices: { USD: 2800, CNY: 20000 },
    suitableFor: ['young_learners', 'conversational'],
    includes: ['One-on-one with your instructor', 'Short practice note afterwards'],
    status: 'proposed',
  },
  {
    id: 'lesson-45',
    category: 'single',
    title: '45-minute Lesson',
    description: 'Time to listen, talk, and refine — the most balanced format for steady progress.',
    durationMinutes: 45,
    sessionTypeId: 'lesson-45',
    prices: { USD: 4000, CNY: 28000 },
    suitableFor: ['teenagers', 'adult_beginners', 'heritage', 'conversational'],
    includes: ['One-on-one with your instructor', 'Lesson materials', 'Practice note afterwards'],
    status: 'proposed',
  },
  {
    id: 'lesson-60',
    category: 'single',
    title: '60-minute Lesson',
    description: 'A full lesson for deeper conversation, reading practice, or structured review.',
    durationMinutes: 60,
    sessionTypeId: 'lesson-60',
    prices: { USD: 5200, CNY: 36000 },
    suitableFor: ['teenagers', 'adult_beginners', 'heritage', 'conversational'],
    includes: ['One-on-one with your instructor', 'Lesson materials', 'Detailed practice note afterwards'],
    status: 'proposed',
  },
  {
    id: 'package-5x45',
    category: 'package',
    title: '5-Lesson Package',
    description: 'Five 45-minute lessons to build a steady weekly rhythm with the same instructor or a few.',
    durationMinutes: 45,
    sessionTypeId: 'lesson-45',
    prices: { USD: 18500, CNY: 130000 },
    suitableFor: ['teenagers', 'adult_beginners', 'heritage', 'conversational'],
    includes: ['5 lesson credits (45 min each)', 'Your first lesson booked at checkout', 'Book the rest any time'],
    sessionCount: 5,
    validityDays: 90,
    redeemsCourseIds: ['lesson-45'],
    terms: [
      'Credits are used only when a lesson is confirmed.',
      'Credits expire 90 days after purchase (draft term).',
      'Cancelling with enough notice returns the credit to your balance (draft term).',
    ],
    status: 'proposed',
  },
  {
    id: 'package-10x45',
    category: 'package',
    title: '10-Lesson Package',
    description: 'Ten 45-minute lessons for learners ready to make Chinese a regular part of their week.',
    durationMinutes: 45,
    sessionTypeId: 'lesson-45',
    prices: { USD: 35000, CNY: 245000 },
    suitableFor: ['teenagers', 'adult_beginners', 'heritage', 'conversational'],
    includes: ['10 lesson credits (45 min each)', 'Your first lesson booked at checkout', 'Book the rest any time'],
    sessionCount: 10,
    validityDays: 180,
    redeemsCourseIds: ['lesson-45'],
    terms: [
      'Credits are used only when a lesson is confirmed.',
      'Credits expire 180 days after purchase (draft term).',
      'Cancelling with enough notice returns the credit to your balance (draft term).',
    ],
    status: 'proposed',
  },
];

export const getCourseById = (id: string): Course | undefined => demoCourses.find((course) => course.id === id);
