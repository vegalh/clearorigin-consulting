import { describe, expect, it } from 'vitest';
import { en } from './en';
import { zh } from './zh';
import { zhCourses, zhFaqSections, zhInstructors } from './zhContent';
import { demoCourses } from '@/data/courses';
import { demoInstructors } from '@/data/instructors';
import { faqSections } from '@/config/faq';
import checkoutSource from '@/services/checkoutService.ts?raw';
import accountSource from '@/services/accountService.ts?raw';
import mockPaymentSource from '@/services/payments/mockPaymentProvider.ts?raw';
import validateSource from '@/lib/scheduling/validate.ts?raw';
import appDataSource from '@/state/AppDataContext.tsx?raw';

/** Recursively list leaf paths, so a structural gap shows up as a readable diff. */
function shape(value: unknown, path = ''): string[] {
  if (Array.isArray(value)) return [`${path}[${value.length}]`];
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, v]) => shape(v, path ? `${path}.${key}` : key));
  }
  return [`${path}:${typeof value}`];
}

describe('translations', () => {
  it('Chinese UI strings have exactly the same structure as English', () => {
    const { reasons: _en, ...enRest } = en;
    const { reasons: _zh, ...zhRest } = zh;
    expect(shape(zhRest)).toEqual(shape(enRest));
  });

  it('functions produce strings in both languages', () => {
    expect(zh.common.minutes(45)).toContain('45');
    expect(zh.checkout.pay('$15.00 USD')).toContain('$15.00 USD');
    expect(zh.policy.summary(10, 24, 24)).toHaveLength(en.policy.summary(10, 24, 24).length);
  });

  it('has Chinese copy for every course, instructor and FAQ entry', () => {
    for (const course of demoCourses) {
      expect(zhCourses[course.id], course.id).toBeDefined();
      expect(zhCourses[course.id].includes).toHaveLength(course.includes.length);
      expect(zhCourses[course.id].terms?.length ?? 0).toBe(course.terms?.length ?? 0);
    }
    for (const instructor of demoInstructors) expect(zhInstructors[instructor.id], instructor.id).toBeDefined();
    expect(zhFaqSections.map((s) => [s.id, s.items.length, s.items.map((i) => i.status)])).toEqual(
      faqSections.map((s) => [s.id, s.items.length, s.items.map((i) => i.status)]),
    );
  });

  it('translates every fixed user-facing service message', () => {
    const messages = new Set<string>();
    for (const text of [checkoutSource, accountSource, mockPaymentSource, validateSource, appDataSource]) {
      for (const match of text.matchAll(/(?:fail\(data, |reason: |failureReason: |: )'([A-Z][^'$]*[.])'/g)) messages.add(match[1]);
    }
    expect(messages.size).toBeGreaterThan(20);
    const missing = [...messages].filter((msg) => !zh.reasons[msg]);
    expect(missing).toEqual([]);
  });
});
