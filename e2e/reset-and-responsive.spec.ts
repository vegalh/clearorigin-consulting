import { test, expect } from '@playwright/test';

test.describe('Demo reset & responsive layout', () => {
  test('reset demo data restores the original seeded bookings after a cancellation', async ({ page }) => {
    await page.goto('/bookings');
    await expect(page.getByText('45-minute Lesson with Maya Chen')).toBeVisible();

    await page.getByRole('button', { name: 'Cancel session' }).click();
    await page.getByRole('button', { name: 'Confirm cancellation' }).click();
    await expect(page.getByText('No upcoming sessions yet.')).toBeVisible();

    // Reset demo data (confirm dialog) should bring the cancelled booking back.
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Reset demo data' }).click();

    await expect(page.getByText('45-minute Lesson with Maya Chen')).toBeVisible();
  });

  const pages = [
    '/',
    '/courses',
    '/instructors',
    '/instructors/maya-chen',
    '/book',
    '/book?course=trial-lesson&instructor=maya-chen',
    '/bookings',
    '/faq',
    '/instructor/dashboard',
    '/instructor/availability',
  ];

  for (const width of [320, 375, 390, 430, 768, 1024, 1440]) {
    test(`key pages render without horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const path of pages) {
        await page.goto(path);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
        expect(hasOverflow, `unexpected horizontal overflow on ${path} at ${width}px`).toBe(false);
      }
    });
  }

  test('home page has no obvious accessibility violations in landmark structure', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
