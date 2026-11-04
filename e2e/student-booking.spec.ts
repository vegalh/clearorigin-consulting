import { test, expect } from '@playwright/test';

test.describe('Student booking flow', () => {
  test('home -> instructors -> profile -> confirm -> success', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /every conversation takes you somewhere/i })).toBeVisible();

    await page.getByRole('link', { name: 'Start a Conversation' }).click();
    await expect(page).toHaveURL(/\/instructors$/);
    await expect(page.getByRole('heading', { name: 'Find your conversation partner.' })).toBeVisible();

    await page.getByRole('link', { name: /view profile & book/i }).first().click();
    await expect(page.getByRole('heading', { level: 2, name: '1. Choose a session type' })).toBeVisible();

    // Pick a time slot (first available day is pre-selected; grab the first time button).
    const timeButtons = page.locator('div.grid.grid-cols-3 button, div.grid.grid-cols-4 button');
    await expect(timeButtons.first()).toBeVisible();
    await timeButtons.first().click();

    await page.getByRole('button', { name: 'Continue to confirm' }).click();
    await expect(page).toHaveURL(/\/booking\/confirm/);
    await expect(page.getByRole('heading', { name: 'Your next conversation is almost here.' })).toBeVisible();

    await page.getByLabel('Full name').fill('Taylor Example');
    await page.getByLabel('Email').fill('taylor@example.com');
    await page.getByRole('button', { name: 'Confirm booking' }).click();

    await expect(page).toHaveURL(/\/booking\/success\//);
    await expect(page.getByRole('heading', { name: "You're all set." })).toBeVisible();
    await expect(page.getByRole('button', { name: /add to calendar/i })).toBeVisible();

    await page.getByRole('link', { name: 'View my bookings' }).click();
    await expect(page).toHaveURL(/\/bookings$/);
    await expect(page.getByRole('heading', { name: 'My Learning Space' })).toBeVisible();
  });

  test('language filter narrows the instructor list', async ({ page }) => {
    await page.goto('/instructors');
    const countText = await page.locator('text=/\\d+ instructors? available/').textContent();
    const totalCount = Number(countText?.match(/\d+/)?.[0]);
    expect(totalCount).toBeGreaterThan(0);

    await page.getByLabel('Language').selectOption('Mandarin');
    await expect(page.locator('text=/\\d+ instructors? available/')).toBeVisible();
    const filteredText = await page.locator('text=/\\d+ instructors? available/').textContent();
    const filteredCount = Number(filteredText?.match(/\d+/)?.[0]);
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThanOrEqual(totalCount);
  });
});
