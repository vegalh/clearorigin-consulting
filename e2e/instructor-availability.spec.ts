import { test, expect } from '@playwright/test';
import { signInAsInstructor, signOut } from './helpers';

test.describe('Instructor availability editing', () => {
  test('switching to instructor role and saving a new weekly slot shows up for students', async ({ page }) => {
    // Instructors sign in to their own account (one-click demo account for Maya Chen).
    await signInAsInstructor(page);
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

    // Sign out and confirm Maya Chen's public profile now reflects the
    // updated weekly schedule (Sunday slots are present).
    await signOut(page);
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
    await signInAsInstructor(page);
    await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible();
    await expect(page.getByText('Today', { exact: true })).toBeVisible();
    await expect(page.getByText('In checkout', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Weekly availability' })).toBeVisible();

    // Booking and payment status are shown separately for each appointment.
    await expect(page.getByText('Booking:').first()).toBeVisible();
    await expect(page.getByText(/Payment:\s*Package credit$/)).toBeVisible();
  });

  test('instructor can set a preferred meeting platform', async ({ page }) => {
    await signInAsInstructor(page);
    await page.getByRole('link', { name: 'Availability' }).click();
    await page.getByText('Google Meet', { exact: true }).click();
    await page.getByRole('link', { name: 'Teaching Studio' }).click();
    await expect(page.getByRole('heading', { name: 'Meeting platform' }).locator('..').getByText('Google Meet')).toBeVisible();
  });
});
