import type { ChineseLevel, LearnerGroupId, LearningGoal } from '@/types';

export const chineseLevelOptions: { value: ChineseLevel; label: string }[] = [
  { value: 'complete_beginner', label: 'Complete beginner' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'heritage', label: 'Heritage speaker' },
  { value: 'not_sure', label: 'Not sure' },
];

export const learningGoalOptions: { value: LearningGoal; label: string }[] = [
  { value: 'everyday_conversation', label: 'Everyday conversation' },
  { value: 'pronunciation', label: 'Pronunciation & tones' },
  { value: 'reading_writing', label: 'Reading & writing characters' },
  { value: 'school_support', label: 'School Chinese support' },
  { value: 'heritage_connection', label: 'Connecting with family & heritage' },
  { value: 'travel', label: 'Travel & living in China' },
  { value: 'business', label: 'Chinese for work' },
  { value: 'exam_prep', label: 'Exam preparation (e.g. HSK)' },
  { value: 'other', label: 'Something else' },
];

export const learnerGroupLabels: Record<LearnerGroupId, string> = {
  young_learners: 'Young learners',
  teenagers: 'Teenagers',
  adult_beginners: 'Adult beginners',
  heritage: 'Heritage learners',
  conversational: 'Conversational learners',
};

