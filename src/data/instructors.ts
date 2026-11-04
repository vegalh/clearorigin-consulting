import type { Instructor } from '@/types';

/**
 * Fictional demo instructors for the prototype. These are NOT real
 * ClearOrigin staff — names, bios, specialties, and schedules are
 * invented for demonstration purposes only (see docs/PROTOTYPE_PLAN.md).
 * Each instructor uses a different IANA timezone so the scheduling
 * engine's timezone conversion and DST handling can be exercised end to end.
 */
export const demoInstructors: Instructor[] = [
  {
    id: 'maya-chen',
    name: 'Maya Chen',
    title: 'Conversation & Fluency Coach',
    avatarInitials: 'MC',
    avatarColorClass: 'bg-co-green',
    languages: ['Mandarin', 'English'],
    specialties: ['Conversational Mandarin', 'Pronunciation Coaching'],
    bio: 'Maya builds sessions around topics learners actually want to talk about, moving from guided prompts to free conversation at a comfortable pace.',
    timezone: 'America/New_York',
    sessionTypeIds: [
      'discovery-conversation',
      'conversation-practice',
      'personalized-session',
      'extended-conversation',
    ],
    isDemo: true,
  },
  {
    id: 'david-okafor',
    title: 'Business Communication Coach',
    name: 'David Okafor',
    avatarInitials: 'DO',
    avatarColorClass: 'bg-co-orange',
    languages: ['English', 'French'],
    specialties: ['Business English', 'Interview Preparation'],
    bio: 'David helps professionals communicate with confidence in meetings, interviews, and everyday workplace conversation.',
    timezone: 'America/Los_Angeles',
    sessionTypeIds: ['discovery-conversation', 'conversation-practice', 'extended-conversation'],
    isDemo: true,
  },
  {
    id: 'priya-nandakumar',
    name: 'Priya Nandakumar',
    title: 'Exam & Academic Prep Coach',
    avatarInitials: 'PN',
    avatarColorClass: 'bg-co-green',
    languages: ['English', 'Hindi'],
    specialties: ['IELTS Preparation', 'Academic Writing'],
    bio: 'Priya focuses on structured, goal-driven practice for learners preparing for exams or academic study abroad.',
    timezone: 'Europe/London',
    sessionTypeIds: [
      'discovery-conversation',
      'conversation-practice',
      'personalized-session',
      'extended-conversation',
    ],
    isDemo: true,
  },
  {
    id: 'liang-wu',
    name: 'Liang Wu',
    title: 'Everyday Conversation Partner',
    avatarInitials: 'LW',
    avatarColorClass: 'bg-co-orange',
    languages: ['Mandarin', 'English'],
    specialties: ['Everyday Mandarin', 'Culture & Media'],
    bio: 'Liang uses stories, short clips, and casual conversation to help learners build natural, everyday speaking confidence.',
    timezone: 'Asia/Shanghai',
    sessionTypeIds: ['conversation-practice', 'personalized-session', 'extended-conversation'],
    isDemo: true,
  },
];

export const getInstructorById = (id: string): Instructor | undefined =>
  demoInstructors.find((instructor) => instructor.id === id);
