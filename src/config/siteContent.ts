import type { ContentStatus, LearnerGroupId } from '@/types';

/**
 * Marketing copy for the home page. Everything here is a PROPOSED message
 * awaiting ClearOrigin's approval; flip `status` to 'confirmed' once approved
 * and the "Draft" labels disappear.
 */
export const heroContent = {
  eyebrow: 'A Place for Conversation · 让对话自然发生',
  headline: 'Make Chinese part of your everyday conversations.',
  body: 'Personalized Chinese lessons built around real conversations, meaningful practice, and your learning goals.',
  primaryCta: { label: 'Book a Trial Lesson', to: '/book?course=trial-lesson' },
  secondaryCta: { label: 'Explore Courses', to: '/courses' },
  status: 'proposed' as ContentStatus,
};

export const teachingPhilosophy: { title: string; chinese: string; body: string }[] = [
  {
    title: 'Listen & Notice',
    chinese: '听 · 留意',
    body: 'Every lesson starts with real Chinese — a story, a clip, a conversation — and time to notice how sounds, tones and phrases are really used.',
  },
  {
    title: 'Talk & Respond',
    chinese: '说 · 回应',
    body: 'You speak early and often. Your instructor keeps the conversation going at your level, so speaking feels natural rather than rehearsed.',
  },
  {
    title: 'Refine & Reuse',
    chinese: '改 · 再用',
    body: 'Gentle corrections and a short practice note help you reuse what you learned — in the next lesson and in everyday life.',
  },
];

export const learnerGroups: { id: LearnerGroupId; title: string; body: string; status: ContentStatus }[] = [
  {
    id: 'young_learners',
    title: 'Young learners',
    body: 'Playful, short lessons with songs, pictures and stories. A parent or guardian books and stays in the loop.',
    status: 'proposed',
  },
  {
    id: 'teenagers',
    title: 'Teenagers',
    body: 'Support alongside school Chinese, plus real conversation about the things teens actually care about.',
    status: 'proposed',
  },
  {
    id: 'adult_beginners',
    title: 'Adult beginners',
    body: 'Start from zero with pinyin, tones and survival phrases — at a pace that respects a busy life.',
    status: 'proposed',
  },
  {
    id: 'heritage',
    title: 'Heritage learners',
    body: 'Understand family conversations already? Build confident speaking, reading and writing on top of what you know.',
    status: 'proposed',
  },
  {
    id: 'conversational',
    title: 'Conversational learners',
    body: 'Already studying? Turn textbook Chinese into natural, everyday conversation.',
    status: 'proposed',
  },
];

export const howToBegin: { title: string; body: string }[] = [
  { title: 'Book a trial lesson', body: 'Pick a time that suits you, in your own timezone.' },
  { title: 'Meet your instructor', body: 'Talk about your goals and try a short piece of a real lesson.' },
  { title: 'Choose your path', body: 'Continue with single lessons or a package — whatever fits your week.' },
];
