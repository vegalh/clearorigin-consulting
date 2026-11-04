import type { ChineseLevel, LearningGoal } from '@/types';

export interface StudentInfoInput {
  fullName: string;
  email: string;
  learningGoal?: string;
}

export interface StudentInfoErrors {
  fullName?: string;
  email?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: string): string | undefined {
  if (!email.trim()) return 'Please enter an email address.';
  if (!EMAIL_PATTERN.test(email.trim())) return 'Please enter a valid email address.';
  return undefined;
}

/** Simple, dependency-free validation for the v1 booking confirmation form. */
export function validateStudentInfo(input: StudentInfoInput): StudentInfoErrors {
  const errors: StudentInfoErrors = {};

  if (!input.fullName.trim()) {
    errors.fullName = 'Please enter your full name.';
  }

  const emailError = validateEmail(input.email);
  if (emailError) errors.email = emailError === 'Please enter an email address.' ? 'Please enter your email address.' : emailError;

  return errors;
}

export interface LearnerDetailsInput {
  bookingFor: 'self' | 'child';
  /** The learner (for a child: first name or nickname only). */
  learnerName: string;
  /** Contact person — the learner themself, or the parent/guardian. */
  contactName: string;
  email: string;
  level: ChineseLevel | '';
  goal: LearningGoal | '';
  guardianConsent: boolean;
}

export type LearnerDetailsErrors = Partial<Record<'learnerName' | 'contactName' | 'email' | 'level' | 'goal' | 'guardianConsent', string>>;

/**
 * Validation for the V3 Details step. When booking for a child we require a
 * guardian's name/email and confirmation that they are the parent or
 * guardian, and ask only for the child's first name — no child email or age.
 */
export function validateLearnerDetails(input: LearnerDetailsInput): LearnerDetailsErrors {
  const errors: LearnerDetailsErrors = {};
  const forChild = input.bookingFor === 'child';

  if (forChild && !input.learnerName.trim()) errors.learnerName = "Please enter the learner's first name or nickname.";
  if (!input.contactName.trim()) {
    errors.contactName = forChild ? "Please enter the parent or guardian's name." : 'Please enter your full name.';
  }
  const emailError = validateEmail(input.email);
  if (emailError) errors.email = emailError;
  if (!input.level) errors.level = 'Please choose a current Chinese level.';
  if (!input.goal) errors.goal = 'Please choose a primary learning goal.';
  if (forChild && !input.guardianConsent) errors.guardianConsent = 'Please confirm you are the parent or guardian.';

  return errors;
}

export function hasValidationErrors(errors: object): boolean {
  return Object.values(errors).some(Boolean);
}
