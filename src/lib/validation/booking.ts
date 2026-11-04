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

/** Simple, dependency-free validation for the booking confirmation form. */
export function validateStudentInfo(input: StudentInfoInput): StudentInfoErrors {
  const errors: StudentInfoErrors = {};

  if (!input.fullName.trim()) {
    errors.fullName = 'Please enter your full name.';
  }

  if (!input.email.trim()) {
    errors.email = 'Please enter your email address.';
  } else if (!EMAIL_PATTERN.test(input.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }

  return errors;
}

export function hasValidationErrors(errors: StudentInfoErrors): boolean {
  return Object.values(errors).some(Boolean);
}
