import { test, expect } from '@playwright/test';

test.describe('Demo reset & responsive layout', () => {
  test('reset demo data restores the original seeded bookings after a cancellation', async ({ page }) => {
    await page.goto('/bookings');
    await expect(page.getByText('Conversation Practice with Maya Chen')).toBeVisible();

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Cancel session' }).click();
    await expect(page.getByText('No upcoming sessions yet.')).toBeVisible();

    // Reset demo data (confirm dialog) should bring the cancelled booking back.
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Reset demo data' }).click();

    await expect(page.getByText('Conversation Practice with Maya Chen')).toBeVisible();
  });

  test('key pages render without horizontal overflow on a mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    for (const path of ['/', '/instructors', '/instructors/maya-chen', '/bookings', '/instructor/dashboard', '/instructor/availability']) {
      await page.goto(path);
      const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      expect(hasOverflow, `unexpected horizontal overflow on ${path}`).toBe(false);
    }
  });

  test('home page has no obvious accessibility violations in landmark structure', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
