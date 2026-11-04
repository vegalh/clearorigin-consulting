import type { Instructor } from '@/types';

/**
 * Fictional demo instructors for the prototype. These are NOT real
 * ClearOrigin staff — names, bios, qualifications, specialties, and schedules
 * are invented for demonstration purposes only (see docs/PROTOTYPE_PLAN.md).
 * Real instructor details should only replace these once provided and
 * verified by ClearOrigin. Each instructor uses a different IANA timezone so
 * the scheduling engine's timezone conversion and DST handling can be
 * exercised end to end.
 */
export const demoInstructors: Instructor[] = [
  {
    id: 'maya-chen',
    name: 'Maya Chen',
    chineseName: '陈美雅',
    title: 'Conversational Mandarin Coach',
    avatarInitials: 'MC',
    avatarColorClass: 'bg-co-sage-dark',
    languages: ['Mandarin', 'English'],
    specialties: ['Conversational Mandarin', 'Pronunciation & tones'],
    bio: 'Maya builds lessons around topics learners actually want to talk about, moving from guided prompts to free conversation at a comfortable pace.',
    qualifications: {
      education: ['M.A. Teaching Chinese to Speakers of Other Languages (demo)'],
      certifications: ['International Chinese Language Teacher Certificate (demo)'],
      credentials: ['Mandarin Proficiency Test, Level 1-A (demo)'],
      yearsTeaching: 8,
      experience: ['Adult evening programs', 'One-on-one online tutoring'],
    },
    approach: {
      philosophy: 'Confidence comes first. When speaking feels safe, accuracy follows naturally.',
      methods: ['Task-based conversation', 'Tone drills woven into real phrases', 'Short recap notes'],
      learnerGroups: ['adult_beginners', 'conversational'],
    },
    timezone: 'America/New_York',
    courseIds: ['trial-lesson', 'lesson-30', 'lesson-45', 'lesson-60', 'package-5x45', 'package-10x45'],
    sessionTypeIds: ['trial-30', 'lesson-30', 'lesson-45', 'lesson-60'],
    isDemo: true,
  },
  {
    id: 'david-okafor',
    name: 'David Okafor',
    chineseName: '欧大卫',
    title: 'Chinese for Work Coach',
    avatarInitials: 'DO',
    avatarColorClass: 'bg-co-clay',
    languages: ['English', 'Mandarin', 'French'],
    specialties: ['Business Chinese', 'Meetings & presentations'],
    bio: 'After a decade working in Shanghai, David helps professionals handle meetings, small talk and presentations in Mandarin with confidence.',
    qualifications: {
      education: ['B.A. Chinese Studies (demo)'],
      certifications: ['HSK Level 6 (demo)', 'Business Chinese Test, Advanced (demo)'],
      credentials: ['Corporate language trainer (demo)'],
      yearsTeaching: 6,
      experience: ['Corporate language programs', 'Interview preparation'],
    },
    approach: {
      philosophy: 'Learn the Chinese you will actually use on Monday morning.',
      methods: ['Role-play of real workplace scenes', 'Phrase banks you keep', 'Recorded feedback'],
      learnerGroups: ['adult_beginners', 'conversational'],
    },
    timezone: 'America/Los_Angeles',
    courseIds: ['trial-lesson', 'lesson-30', 'lesson-60'],
    sessionTypeIds: ['trial-30', 'lesson-30', 'lesson-60'],
    isDemo: true,
  },
  {
    id: 'priya-nandakumar',
    name: 'Priya Nandakumar',
    chineseName: '李雅',
    title: 'School & HSK Chinese Coach',
    avatarInitials: 'PN',
    avatarColorClass: 'bg-co-orange-dark',
    languages: ['English', 'Mandarin', 'Hindi'],
    specialties: ['HSK preparation', 'Reading & writing'],
    bio: 'Priya brings structure and patience to teenagers and adults preparing for school exams or HSK, without losing the joy of conversation.',
    qualifications: {
      education: ['M.Ed. Language Education (demo)'],
      certifications: ['HSK examiner training (demo)'],
      credentials: ['Secondary school Mandarin teacher (demo)'],
      yearsTeaching: 10,
      experience: ['Secondary school classrooms', 'HSK 1–5 exam preparation'],
    },
    approach: {
      philosophy: 'Clear structure, small wins every lesson, and plenty of encouragement.',
      methods: ['Graded reading', 'Character stories', 'Exam-style speaking practice'],
      learnerGroups: ['teenagers', 'adult_beginners'],
    },
    timezone: 'Europe/London',
    courseIds: ['trial-lesson', 'lesson-30', 'lesson-45', 'lesson-60', 'package-5x45', 'package-10x45'],
    sessionTypeIds: ['trial-30', 'lesson-30', 'lesson-45', 'lesson-60'],
    isDemo: true,
  },
  {
    id: 'liang-wu',
    name: 'Liang Wu',
    chineseName: '吴亮',
    title: 'Young Learner & Heritage Teacher',
    avatarInitials: 'LW',
    avatarColorClass: 'bg-co-ink',
    languages: ['Mandarin', 'English'],
    specialties: ['Young learners', 'Heritage Chinese'],
    bio: 'Liang uses stories, songs, and short clips to help children and heritage learners speak naturally and enjoy Chinese at home.',
    qualifications: {
      education: ['B.Ed. Primary Education (demo)'],
      certifications: ['Teaching Chinese to Children Certificate (demo)'],
      credentials: ['Weekend heritage school lead teacher (demo)'],
      yearsTeaching: 7,
      experience: ['Weekend heritage schools', 'Online lessons for ages 6–12'],
    },
    approach: {
      philosophy: 'Children learn best through play, and families learn best together.',
      methods: ['Picture-book reading', 'Songs and rhymes', 'Parent-friendly practice ideas'],
      learnerGroups: ['young_learners', 'heritage', 'teenagers'],
    },
    timezone: 'Asia/Shanghai',
    courseIds: ['lesson-30', 'lesson-45', 'lesson-60', 'package-5x45', 'package-10x45'],
    sessionTypeIds: ['lesson-30', 'lesson-45', 'lesson-60'],
    isDemo: true,
  },
];

export const getInstructorById = (id: string): Instructor | undefined =>
  demoInstructors.find((instructor) => instructor.id === id);
