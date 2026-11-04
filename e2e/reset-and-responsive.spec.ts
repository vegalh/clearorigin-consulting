import { test, expect } from '@playwright/test';
import { signInAsStudent } from './helpers';
import type { Page } from '@playwright/test';

/** Language-independent demo sign-in (the quick-account buttons are the first ones listed). */
async function signInAsStudentAnyLang(page: Page) {
  await page.evaluate(() => localStorage.setItem('clearorigin-booking-prototype:session', JSON.stringify({ role: 'student', userId: 'student-alex' })));
}
async function signInAsInstructorAnyLang(page: Page) {
  await page.evaluate(() => localStorage.setItem('clearorigin-booking-prototype:session', JSON.stringify({ role: 'instructor', userId: 'maya-chen' })));
}

test.describe('Demo reset & responsive layout', () => {
  test('reset demo data restores the original seeded bookings after a cancellation', async ({ page }) => {
    await signInAsStudent(page);
    await expect(page.getByText('45-minute Lesson with Maya Chen')).toBeVisible();

    await page.getByRole('button', { name: 'Cancel session' }).click();
    await page.getByRole('button', { name: 'Confirm cancellation' }).click();
    await expect(page.getByText('No upcoming sessions yet.')).toBeVisible();

    // Reset demo data (confirm dialog) should bring the cancelled booking back.
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Reset demo data' }).click();

    // Reset also signs out; the seeded booking is back once Alex signs in again.
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
    await signInAsStudent(page);
    await expect(page.getByText('45-minute Lesson with Maya Chen')).toBeVisible();
  });

  const publicPages = ['/', '/courses', '/instructors', '/instructors/maya-chen', '/book', '/book?course=trial-lesson&instructor=maya-chen', '/faq', '/login'];
  const studentPages = ['/bookings', '/account'];
  const instructorPages = ['/instructor/dashboard', '/instructor/availability', '/account'];

  for (const lang of ['en', 'zh'] as const) {
    for (const width of [320, 375, 390, 430, 768, 1024, 1440]) {
      test(`key pages render without horizontal overflow at ${width}px (${lang})`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        const check = async (paths: string[]) => {
          for (const path of paths) {
            await page.goto(path);
            await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
            const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
            expect(hasOverflow, `unexpected horizontal overflow on ${path} at ${width}px (${lang})`).toBe(false);
          }
        };
        await page.goto(`/?lang=${lang}`); // remembered for the rest of the visit
        await check(publicPages);
        await signInAsStudentAnyLang(page);
        await check(studentPages);
        await signInAsInstructorAnyLang(page);
        await check(instructorPages);
      });
    }
  }

  test('home page has no obvious accessibility violations in landmark structure', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
