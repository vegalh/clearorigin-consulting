import { test, expect } from '@playwright/test';
import { fillSelfDetails, pickFirstTime, scheduleWith } from './helpers';

test.describe('Student booking flow', () => {
  test('home -> trial lesson -> schedule -> details -> simulated payment -> confirmation', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /make chinese part of your everyday conversations/i })).toBeVisible();

    await page.getByRole('link', { name: 'Book a Trial Lesson' }).first().click();
    await expect(page).toHaveURL(/\/book\?course=trial-lesson/);
    await expect(page.getByRole('heading', { name: 'Choose an instructor and time' })).toBeVisible();

    await scheduleWith(page, 'Maya Chen');
    await fillSelfDetails(page);
    await page.getByRole('button', { name: 'Continue to payment' }).click();

    await expect(page).toHaveURL(/\/book\/checkout\//);
    await expect(page.getByText('Your meeting link will be available after confirmation.')).toBeVisible();
    await expect(page.getByText('Card payment — Demo')).toBeVisible();
    await page.getByRole('button', { name: /Pay \$15\.00 USD \(simulated\)/ }).click();

    await expect(page).toHaveURL(/\/booking\/success\//);
    await expect(page.getByRole('heading', { name: "You're all set." })).toBeVisible();
    await expect(page.getByText(/^CO-[A-Z0-9]{6}$/)).toBeVisible();
    await expect(page.getByText('Paid (simulated)')).toBeVisible();
    await expect(page.getByText('Link not created (demo)')).toBeVisible();
    await expect(page.getByRole('button', { name: /add to calendar/i })).toBeVisible();

    await page.getByRole('link', { name: 'View my bookings' }).click();
    await expect(page).toHaveURL(/\/bookings$/);
    await expect(page.getByRole('heading', { name: 'My Learning Space' })).toBeVisible();
    await expect(page.getByText('Trial Lesson with Maya Chen')).toBeVisible();
  });

  test('instructor profile -> course & time -> details', async ({ page }) => {
    await page.goto('/instructors');
    await expect(page.getByRole('heading', { name: 'Find your conversation partner.' })).toBeVisible();

    await page.getByRole('link', { name: /view profile & book/i }).first().click();
    await expect(page.getByRole('heading', { level: 2, name: '1. Choose a course' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Qualifications' })).toBeVisible();
    await expect(page.getByText('Intro video placeholder')).toBeVisible();

    await page.getByRole('button', { name: /45-minute Lesson/ }).click();
    await pickFirstTime(page);
    await page.getByRole('button', { name: 'Continue to details' }).click();

    await expect(page).toHaveURL(/\/book\?.*course=lesson-45.*step=details/);
    await expect(page.getByRole('heading', { name: 'Tell us about the learner' })).toBeVisible();
  });

  test('details step validates required learner information', async ({ page }) => {
    await page.goto('/book?course=lesson-30');
    await scheduleWith(page, 'Maya Chen');
    await page.getByLabel('Full name').fill('');
    await page.getByRole('button', { name: 'Continue to payment' }).click();
    await expect(page.getByText('Please enter your full name.')).toBeVisible();
    await expect(page.getByText('Please choose a current Chinese level.')).toBeVisible();
    await expect(page.getByText('Please choose a primary learning goal.')).toBeVisible();
    await expect(page).toHaveURL(/step=details/);
  });

  test('language filter narrows the instructor list', async ({ page }) => {
    await page.goto('/instructors');
    const countText = await page.locator('text=/\\d+ instructors? available/').textContent();
    const totalCount = Number(countText?.match(/\d+/)?.[0]);
    expect(totalCount).toBeGreaterThan(0);

    await page.getByLabel('Language', { exact: true }).selectOption('Mandarin');
    await expect(page.locator('text=/\\d+ instructors? available/')).toBeVisible();
    const filteredText = await page.locator('text=/\\d+ instructors? available/').textContent();
    const filteredCount = Number(filteredText?.match(/\d+/)?.[0]);
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThanOrEqual(totalCount);

    await page.getByLabel('Learner').selectOption('young_learners');
    await expect(page.getByText('1 instructor available')).toBeVisible();
    await expect(page.getByText('Liang Wu')).toBeVisible();
  });
});
