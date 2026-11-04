import type { AppData, Instructor, Student } from '@/types';

/**
 * Prototype accounts: sign-in is by email only (no password and no email
 * verification yet — see docs/BOOKING_V3_REPORT.md). Students self-register
 * by email; instructor accounts are pre-provisioned by ClearOrigin and must
 * match an instructor's `email`.
 */

export type AccountResult<T extends object = object> = ({ ok: true; data: AppData } & T) | { ok: false; reason: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalize = (email: string) => email.trim().toLowerCase();

export function findStudentByEmail(data: AppData, email: string): Student | undefined {
  return data.students.find((s) => normalize(s.email) === normalize(email));
}

export function findInstructorByEmail(data: AppData, email: string): Instructor | undefined {
  return data.instructors.find((i) => i.email && normalize(i.email) === normalize(email));
}

/** Sign in an existing student by email, or create a new student account for a new email. */
export function signInOrRegisterStudent(data: AppData, input: { email: string; fullName?: string }): AccountResult<{ studentId: string; created: boolean }> {
  const email = input.email.trim();
  if (!EMAIL_PATTERN.test(email)) return { ok: false, reason: 'Please enter a valid email address.' };

  const existing = findStudentByEmail(data, email);
  if (existing) return { ok: true, data, studentId: existing.id, created: false };

  const student: Student = {
    id: `student-${crypto.randomUUID()}`,
    fullName: input.fullName?.trim() || email.split('@')[0],
    email,
  };
  return { ok: true, data: { ...data, students: [...data.students, student] }, studentId: student.id, created: true };
}

export function updateStudentProfile(data: AppData, studentId: string, patch: { fullName: string; email: string }): AccountResult {
  const student = data.students.find((s) => s.id === studentId);
  if (!student) return { ok: false, reason: 'Account not found.' };
  if (!patch.fullName.trim()) return { ok: false, reason: 'Please enter your full name.' };
  if (!EMAIL_PATTERN.test(patch.email.trim())) return { ok: false, reason: 'Please enter a valid email address.' };
  const clash = findStudentByEmail(data, patch.email);
  if (clash && clash.id !== studentId) return { ok: false, reason: 'Another account already uses that email.' };

  const next: Student = { ...student, fullName: patch.fullName.trim(), email: patch.email.trim() };
  return { ok: true, data: { ...data, students: data.students.map((s) => (s.id === studentId ? next : s)) } };
}
