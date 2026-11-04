import { expect, type Page } from '@playwright/test';

/** Time buttons rendered by SlotPicker (3 columns on phones, 4 on wider screens). */
export const timeButtons = (page: Page) => page.locator('div.grid.grid-cols-3 button, div.grid.grid-cols-4 button');

export async function pickFirstTime(page: Page) {
  await expect(timeButtons(page).first()).toBeVisible();
  await timeButtons(page).first().click();
}

/** Fill the Details step for an adult booking for themself. */
export async function fillSelfDetails(page: Page, name = 'Taylor Example', email = 'taylor@example.com') {
  await page.getByLabel('Full name').fill(name);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Current Chinese level').selectOption('beginner');
  await page.getByLabel('Primary learning goal').selectOption('everyday_conversation');
}

/** From the Schedule step: choose an instructor by name and the first open time, then continue. */
export async function scheduleWith(page: Page, instructorName: string) {
  await page.locator('label', { has: page.getByRole('radio') }).filter({ hasText: instructorName }).click();
  await expect(page.getByRole('heading', { name: new RegExp(`Available times with ${instructorName.split(' ')[0]}`) })).toBeVisible();
  await pickFirstTime(page);
  await page.getByRole('button', { name: 'Continue to details' }).click();
  await expect(page.getByRole('heading', { name: 'Tell us about the learner' })).toBeVisible();
}

/** Course → Schedule → Details for the trial lesson with Maya, ending on the Payment step. */
export async function reachTrialCheckout(page: Page) {
  await page.goto('/book?course=trial-lesson');
  await scheduleWith(page, 'Maya Chen');
  await fillSelfDetails(page);
  await page.getByRole('button', { name: 'Continue to payment' }).click();
  await expect(page.getByRole('heading', { name: 'Review and pay' })).toBeVisible();
  await expect(page.getByRole('timer')).toBeVisible();
}

/** One-click demo sign-in from the login page (stands in until email verification exists). */
export async function signInAsStudent(page: Page, name = 'Alex Johnson') {
  await page.goto('/login');
  await page.getByRole('button', { name: `Continue as ${name} (demo student)` }).click();
  await expect(page).toHaveURL(/\/bookings$/);
}

export async function signInAsInstructor(page: Page, name = 'Maya Chen') {
  await page.goto('/login?role=instructor');
  await page.getByRole('button', { name: `Continue as ${name} (demo instructor)` }).click();
  await expect(page).toHaveURL(/\/instructor\/dashboard$/);
}

export async function signOut(page: Page) {
  await page.goto('/account');
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
}
