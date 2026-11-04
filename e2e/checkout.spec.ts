import { test, expect } from '@playwright/test';
import { fillSelfDetails, pickFirstTime, reachTrialCheckout, scheduleWith } from './helpers';

test.describe('Checkout, holds and simulated payment', () => {
  test('a failed payment does not confirm; a retry succeeds', async ({ page }) => {
    await reachTrialCheckout(page);

    await page.getByLabel('Payment fails').check();
    await page.getByRole('button', { name: /Pay .* \(simulated\)/ }).click();
    await expect(page.getByRole('alert')).toContainText('declined');
    await expect(page.getByRole('alert')).toContainText('not confirmed');
    await expect(page).toHaveURL(/\/book\/checkout\//);

    // Nothing confirmed yet: My Learning Space shows the checkout as in progress, not as a lesson.
    await page.getByRole('link', { name: 'My Learning Space' }).click();
    await expect(page.getByText(/checkout in progress/)).toBeVisible();
    await expect(page.getByText('Trial Lesson with Maya Chen')).toHaveCount(0);

    await page.getByRole('link', { name: 'Resume checkout' }).click();
    await page.getByLabel('Payment succeeds').check();
    await page.getByRole('button', { name: /Pay .* \(simulated\)/ }).click();
    await expect(page.getByRole('heading', { name: "You're all set." })).toBeVisible();
  });

  test('cancelling checkout releases the time and charges nothing', async ({ page }) => {
    await reachTrialCheckout(page);
    await page.getByRole('button', { name: 'Cancel and release this time' }).click();
    await expect(page.getByRole('heading', { name: 'You left checkout.' })).toBeVisible();
    await expect(page.getByText('nothing was charged')).toBeVisible();

    await page.getByRole('link', { name: 'My Learning Space' }).click();
    await expect(page.getByText(/checkout in progress/)).toHaveCount(0);
  });

  test('a refresh during checkout keeps the hold', async ({ page }) => {
    await reachTrialCheckout(page);
    const url = page.url();
    await page.reload();
    await expect(page).toHaveURL(url);
    await expect(page.getByRole('heading', { name: 'Review and pay' })).toBeVisible();
    await expect(page.getByRole('timer')).toBeVisible();
  });

  test('a refresh while a payment is processing does not corrupt the booking', async ({ page }) => {
    await reachTrialCheckout(page);
    await page.getByRole('button', { name: /Pay .* \(simulated\)/ }).click();
    await expect(page.getByRole('button', { name: 'Processing simulated payment…' })).toBeVisible();
    await page.reload();

    await expect(page.getByRole('heading', { name: 'Review and pay' })).toBeVisible();
    await expect(page.getByRole('alert')).toContainText('reloaded before the simulated payment finished');
    await page.getByRole('button', { name: /Pay .* \(simulated\)/ }).click();
    await expect(page.getByRole('heading', { name: "You're all set." })).toBeVisible();
  });

  test('an expired hold releases the time and cannot be paid', async ({ page }) => {
    await page.clock.install();
    await reachTrialCheckout(page);
    await page.clock.fastForward('11:00');
    await expect(page.getByRole('heading', { name: 'Your hold has expired.' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Pay .* \(simulated\)/ })).toHaveCount(0);
    await page.getByRole('link', { name: 'Choose a time again' }).click();
    await expect(page.getByRole('heading', { name: 'Choose an instructor and time' })).toBeVisible();
  });

  test('a parent can book for a child with only the child’s first name', async ({ page }) => {
    await page.goto('/book?course=lesson-30');
    await scheduleWith(page, 'Liang Wu');
    await page.getByText("My child (I'm the parent or guardian)").click();
    await page.getByLabel("Learner's first name or nickname").fill('Mia');
    await page.getByLabel('Parent or guardian name').fill('Jordan Example');
    await page.getByLabel('Parent or guardian email').fill('jordan@example.com');
    await page.getByLabel('Current Chinese level').selectOption('heritage');
    await page.getByLabel('Primary learning goal').selectOption('heritage_connection');

    await page.getByRole('button', { name: 'Continue to payment' }).click();
    await expect(page.getByText('Please confirm you are the parent or guardian.')).toBeVisible();
    await page.getByLabel(/I am this learner's parent or legal guardian/).check();
    await page.getByRole('button', { name: 'Continue to payment' }).click();

    await expect(page.getByText('(booked by parent/guardian)')).toBeVisible();
    await page.getByRole('button', { name: /Pay .* \(simulated\)/ }).click();
    await expect(page.getByRole('heading', { name: "You're all set." })).toBeVisible();
    await expect(page.getByText('Booked by parent/guardian')).toBeVisible();

    // The instructor sees the learner and the guardian without any payment details.
    await page.getByRole('button', { name: 'Instructor', exact: true }).click();
    await page.getByLabel('Acting as instructor').selectOption('liang-wu');
    await page.getByRole('link', { name: 'Teaching Studio' }).click();
    await expect(page.getByText(/Mia · booked by Jordan Example \(guardian\)/)).toBeVisible();
    await expect(page.getByText('Card payment — Demo')).toHaveCount(0);
  });

  test('paying in CNY offers the WeChat Pay and Alipay demos', async ({ page }) => {
    await page.goto('/book?course=lesson-45');
    await scheduleWith(page, 'Priya Nandakumar');
    await fillSelfDetails(page);
    await page.locator('label', { hasText: '¥280.00 CNY' }).click();
    await page.getByRole('button', { name: 'Continue to payment' }).click();

    await expect(page.getByText('WeChat Pay — Demo')).toBeVisible();
    await expect(page.getByText('Alipay — Demo')).toBeVisible();
    await page.getByText('WeChat Pay — Demo').click();
    await page.getByRole('button', { name: 'Pay ¥280.00 CNY (simulated)' }).click();
    await expect(page.getByRole('heading', { name: "You're all set." })).toBeVisible();
    await expect(page.getByText(/¥280\.00 CNY · WeChat Pay — Demo/)).toBeVisible();
  });

  test('buying a package grants credits, and a credit books a lesson without payment', async ({ page }) => {
    await page.goto('/courses');
    await expect(page.getByText('$15.00 USD').first()).toBeVisible();
    await page.getByRole('link', { name: 'Choose 5-Lesson Package' }).click();
    await scheduleWith(page, 'Maya Chen');
    await fillSelfDetails(page, 'Alex Johnson', 'alex.johnson@example.com');
    await page.getByRole('button', { name: 'Continue to payment' }).click();
    await page.getByRole('button', { name: 'Pay $185.00 USD (simulated)' }).click();
    await expect(page.getByRole('heading', { name: "You're all set." })).toBeVisible();
    await expect(page.getByText(/Package credits: 4 of 5 remaining/)).toBeVisible();

    await page.getByRole('link', { name: 'View my bookings' }).click();
    await expect(page.getByRole('region', { name: 'Package credits' }).getByText('5-Lesson Package')).toHaveCount(2); // seeded + new

    await page.getByRole('link', { name: 'Book with a credit' }).last().click();
    await scheduleWith(page, 'Priya Nandakumar');
    await page.getByLabel('Current Chinese level').selectOption('beginner');
    await page.getByLabel('Primary learning goal').selectOption('travel');
    await page.getByRole('button', { name: 'Continue to confirm' }).click();
    await expect(page.getByRole('heading', { name: 'Confirm with your package credit' })).toBeVisible();
    await page.getByRole('button', { name: 'Confirm with 1 credit' }).click();
    await expect(page.getByRole('heading', { name: "You're all set." })).toBeVisible();
    await expect(page.getByText('Package credit', { exact: true })).toBeVisible();
    await expect(page.getByText(/Package credits: 3 of 5 remaining/)).toBeVisible();
  });

  test('a booked time is no longer offered to others while held', async ({ page }) => {
    await page.goto('/book?course=trial-lesson&instructor=maya-chen');
    await pickFirstTime(page);
    const chosen = new URL(page.url()).searchParams.get('start');
    await page.getByRole('button', { name: 'Continue to details' }).click();
    await fillSelfDetails(page);
    await page.getByRole('button', { name: 'Continue to payment' }).click();
    await expect(page.getByRole('heading', { name: 'Review and pay' })).toBeVisible();

    await page.goto('/book?course=trial-lesson&instructor=maya-chen');
    await pickFirstTime(page);
    expect(new URL(page.url()).searchParams.get('start')).not.toBe(chosen);
  });
});

test.describe('Courses & FAQ', () => {
  test('courses page shows trial, single lessons and packages with durations and demo prices', async ({ page }) => {
    await page.goto('/courses');
    await expect(page.getByRole('heading', { name: 'Courses & Pricing' })).toBeVisible();
    for (const heading of ['Trial lesson', 'Single lessons', 'Lesson packages']) {
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    }
    await expect(page.getByText('5 × 45 min')).toBeVisible();
    await expect(page.getByText('$40.00 USD').first()).toBeVisible();
    await expect(page.getByText(/Demo prices and formats/)).toBeVisible();
  });

  test('FAQ explains procedures and flags draft policy', async ({ page }) => {
    await page.goto('/faq');
    for (const heading of ['Lessons', 'Scheduling', 'Payments', 'Cancellations & Refunds']) {
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    }
    const refund = page.locator('details', { hasText: 'Can I receive a refund?' });
    await refund.getByText('Can I receive a refund?').click();
    await expect(refund.getByText(/Refunds are never automatic/)).toBeVisible();
    await expect(refund.getByText('Needs ClearOrigin confirmation')).toBeVisible();
  });
});
