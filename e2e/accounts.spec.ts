import { test, expect } from '@playwright/test';
import { fillSelfDetails, scheduleWith, signInAsInstructor, signInAsStudent, signOut } from './helpers';

test.describe('Separate student and instructor accounts', () => {
  test('signed-out visitors are sent to sign in for student and instructor areas', async ({ page }) => {
    await page.goto('/bookings');
    await expect(page).toHaveURL(/\/login\?role=student&next=%2Fbookings/);
    await expect(page.getByRole('heading', { name: 'Sign in to ClearOrigin' })).toBeVisible();

    await page.goto('/instructor/dashboard');
    await expect(page).toHaveURL(/\/login\?role=instructor/);
    await expect(page.getByRole('tab', { name: "I'm an instructor" })).toHaveAttribute('aria-selected', 'true');
  });

  test('a student registers with an email and lands back where they were going', async ({ page }) => {
    await page.goto('/bookings');
    await page.getByLabel('Email address').fill('new.learner@example.com');
    await page.getByLabel('Your name (for new accounts)').fill('New Learner');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();

    await expect(page).toHaveURL(/\/bookings$/);
    await expect(page.getByText('Showing demo bookings for New Learner.')).toBeVisible();
    await expect(page.getByText('No upcoming sessions yet.')).toBeVisible();
    await expect(page.getByRole('link', { name: /Account settings for New Learner/ })).toBeVisible();
  });

  test('instructors sign in with their instructor email; unknown emails are refused', async ({ page }) => {
    await page.goto('/login?role=instructor');
    await page.getByLabel('Email address').fill('nobody@example.com');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('No instructor account uses that email');

    await page.getByLabel('Email address').fill('priya.nandakumar@instructors.example.com');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(page).toHaveURL(/\/instructor\/dashboard$/);
    await expect(page.getByRole('heading', { name: 'Welcome back, Priya' })).toBeVisible();
    // Instructors get the studio navigation, not the student one.
    await expect(page.getByRole('link', { name: 'My Learning Space' })).toHaveCount(0);
  });

  test('each role is kept out of the other role’s area', async ({ page }) => {
    await signInAsStudent(page);
    await page.goto('/instructor/dashboard');
    await expect(page.getByRole('heading', { name: /This page is for instructors/ })).toBeVisible();
    await page.getByRole('button', { name: 'Sign out and switch account' }).click();
    await expect(page.getByRole('heading', { name: 'Sign in to ClearOrigin' })).toBeVisible();

    await signInAsInstructor(page);
    await page.goto('/bookings');
    await expect(page.getByRole('heading', { name: /This page is for students/ })).toBeVisible();
  });

  test('account settings update the student profile and keep emails unique', async ({ page }) => {
    await signInAsStudent(page);
    await page.goto('/account');
    await expect(page.getByText('Not verified — email verification is coming in a later version.')).toBeVisible();

    await page.getByLabel('Email').fill('jordan.lee@example.com');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByRole('status')).toContainText('Another account already uses that email.');

    await page.getByLabel('Full name').fill('Alex J. Johnson');
    await page.getByLabel('Email').fill('alex.johnson@example.com');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByRole('status')).toContainText('Saved');
    await expect(page.getByRole('link', { name: /Account settings for Alex J\. Johnson/ })).toBeVisible();

    await signOut(page);
    await expect(page.getByRole('link', { name: /Account settings/ })).toHaveCount(0);
  });

  test('guest checkout creates a student account from the email entered', async ({ page }) => {
    await page.goto('/book?course=lesson-30');
    await scheduleWith(page, 'Maya Chen');
    await expect(page.getByText(/We'll create a student account with this email/)).toBeVisible();
    await page.getByLabel('Full name').fill('Guest Person');
    await fillSelfDetails(page, 'Guest Person', 'guest.person@example.com');
    await page.getByRole('button', { name: 'Continue to payment' }).click();
    await expect(page.getByRole('heading', { name: 'Review and pay' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Account settings for Guest Person/ })).toBeVisible();
  });

  test('instructor accounts cannot book lessons', async ({ page }) => {
    await signInAsInstructor(page);
    await page.goto('/book?course=lesson-30');
    await scheduleWith(page, 'Maya Chen');
    await expect(page.getByRole('alert')).toContainText('signed in as an instructor');
    await expect(page.getByRole('button', { name: 'Continue to payment' })).toBeDisabled();
  });
});
