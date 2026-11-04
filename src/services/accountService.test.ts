import { describe, expect, it } from 'vitest';
import { createSeedData } from '@/data/seed';
import { findInstructorByEmail, signInOrRegisterStudent, updateStudentProfile } from './accountService';

const data = createSeedData(new Date('2026-11-04T12:00:00Z'));

describe('accountService', () => {
  it('signs an existing student in by email, case-insensitively, without creating a duplicate', () => {
    const result = signInOrRegisterStudent(data, { email: '  Alex.Johnson@Example.com ' });
    expect(result.ok && result.studentId).toBe('student-alex');
    expect(result.ok && result.created).toBe(false);
    expect(result.ok && result.data.students).toHaveLength(data.students.length);
  });

  it('registers a new student for a new email', () => {
    const result = signInOrRegisterStudent(data, { email: 'new@example.com', fullName: 'New Learner' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.created).toBe(true);
    expect(result.data.students.find((s) => s.id === result.studentId)).toMatchObject({ email: 'new@example.com', fullName: 'New Learner' });
  });

  it('rejects an invalid email', () => {
    expect(signInOrRegisterStudent(data, { email: 'nope' }).ok).toBe(false);
  });

  it('only matches pre-provisioned instructor accounts', () => {
    expect(findInstructorByEmail(data, 'MAYA.CHEN@instructors.example.com')?.id).toBe('maya-chen');
    expect(findInstructorByEmail(data, 'alex.johnson@example.com')).toBeUndefined();
  });

  it('updates a profile but refuses an email used by another account', () => {
    const ok = updateStudentProfile(data, 'student-alex', { fullName: 'Alex J.', email: 'alex.new@example.com' });
    expect(ok.ok && ok.data.students.find((s) => s.id === 'student-alex')?.email).toBe('alex.new@example.com');
    const clash = updateStudentProfile(data, 'student-alex', { fullName: 'Alex', email: 'jordan.lee@example.com' });
    expect(clash.ok).toBe(false);
  });
});
