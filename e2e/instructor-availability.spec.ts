import { test, expect } from '@playwright/test';

test.describe('Instructor availability editing', () => {
  test('switching to instructor role and saving a new weekly slot shows up for students', async ({ page }) => {
    await page.goto('/');

    // Switch the demo role to "Instructor" (defaults to acting as Maya Chen).
    await page.getByRole('button', { name: 'Instructor', exact: true }).click();
    await expect(page).toHaveURL(/\/$/);

    await page.getByRole('link', { name: 'Availability' }).click();
    await expect(page.getByRole('heading', { name: 'Availability' })).toBeVisible();

    // Enable Sunday availability (likely off by default for Maya Chen's seed data).
    const sundayCheckbox = page.getByLabel('Sunday');
    const wasChecked = await sundayCheckbox.isChecked();
    if (!wasChecked) {
      await sundayCheckbox.check();
    }
    await page.getByRole('button', { name: 'Save weekly schedule' }).click();
    await expect(page.getByText('Saved')).toBeVisible();

    // Switch back to the student view and confirm Maya Chen's profile now
    // reflects the updated weekly schedule (Sunday slots are present).
    await page.getByRole('button', { name: 'Student', exact: true }).click();
    await page.goto('/instructors/maya-chen');
    await expect(page.getByRole('heading', { name: 'Maya Chen' })).toBeVisible();

    const dayButtons = page.locator('.no-scrollbar button');
    await expect(dayButtons.first()).toBeVisible();
    const hasSunday = await dayButtons.evaluateAll((buttons) =>
      buttons.some((b) => b.textContent?.includes('Sun')),
    );
    expect(hasSunday).toBe(true);
  });

  test('instructor dashboard shows stats and upcoming sessions', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Instructor', exact: true }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();

    await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible();
    await expect(page.getByText('Today')).toBeVisible();
    await expect(page.getByText('Completed')).toBeVisible();
    await expect(page.getByText('Cancelled')).toBeVisible();
  });
});
