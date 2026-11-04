import { describe, expect, it } from 'vitest';
import { hasValidationErrors, validateLearnerDetails, type LearnerDetailsInput } from './booking';

const valid: LearnerDetailsInput = {
  bookingFor: 'self',
  learnerName: '',
  contactName: 'Sam Taylor',
  email: 'sam@example.com',
  level: 'beginner',
  goal: 'travel',
  guardianConsent: false,
};

describe('validateLearnerDetails', () => {
  it('accepts a complete self booking without a separate learner name', () => {
    expect(hasValidationErrors(validateLearnerDetails(valid))).toBe(false);
  });

  it('requires name, valid email, level and goal', () => {
    const errors = validateLearnerDetails({ ...valid, contactName: ' ', email: 'not-an-email', level: '', goal: '' });
    expect(Object.keys(errors).sort()).toEqual(['contactName', 'email', 'goal', 'level']);
  });

  it('for a child, requires the learner first name, guardian contact and guardian confirmation', () => {
    const errors = validateLearnerDetails({ ...valid, bookingFor: 'child', learnerName: '', contactName: '' });
    expect(errors.learnerName).toBeDefined();
    expect(errors.contactName).toMatch(/guardian/);
    expect(errors.guardianConsent).toBeDefined();

    const ok = validateLearnerDetails({ ...valid, bookingFor: 'child', learnerName: 'Mia', contactName: 'Jordan Lee', guardianConsent: true });
    expect(hasValidationErrors(ok)).toBe(false);
  });
});
