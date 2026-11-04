import { test, expect } from '@playwright/test';
import { signInAsStudent, timeButtons } from './helpers';

test.describe('My Learning Space - cancel & reschedule (seeded demo data)', () => {
  test('shows seeded bookings split across tabs, with payment, meeting and package status', async ({ page }) => {
    await signInAsStudent(page);
    await expect(page.getByRole('heading', { name: 'My Learning Space' })).toBeVisible();

    // Seeded demo data gives student-alex exactly one upcoming, one past
    // (completed), and one cancelled booking, plus a 5-lesson package.
    await expect(page.getByRole('heading', { name: 'Package credits' })).toBeVisible();
    await expect(page.getByText('5-Lesson Package')).toBeVisible();

    await expect(page.getByRole('button', { name: /^Upcoming \(\d+\)$/ })).toBeVisible();
    await page.getByRole('button', { name: /^Past \(\d+\)$/ }).click();
    await expect(page.getByText('45-minute Lesson with Liang Wu')).toBeVisible();

    await page.getByRole('button', { name: /^Cancelled \(\d+\)$/ }).click();
    await expect(page.getByText('Trial Lesson with David Okafor')).toBeVisible();
    await expect(page.getByText('Refund pending review')).toBeVisible();

    await page.getByRole('button', { name: /^Upcoming \(\d+\)$/ }).click();
    await expect(page.getByText('45-minute Lesson with Maya Chen')).toBeVisible();
    await expect(page.getByText(/Payment:\s*Package credit$/)).toBeVisible();
    await expect(page.getByText('Link not created (demo)')).toBeVisible();
  });

  test('can reschedule the upcoming booking to a different time', async ({ page }) => {
    await signInAsStudent(page);
    await expect(page.getByText('45-minute Lesson with Maya Chen')).toBeVisible();

    await page.getByRole('button', { name: 'Reschedule' }).click();
    await expect(page.getByText(/Choose a new 45-minute time with Maya Chen/)).toBeVisible();

    await expect(timeButtons(page).first()).toBeVisible();
    await timeButtons(page).first().click();
    await page.getByRole('button', { name: 'Confirm new time' }).click();

    // Reschedule form closes back to the normal row view on success.
    await expect(page.getByText(/Choose a new 45-minute time/)).toHaveCount(0);
    await expect(page.getByText('45-minute Lesson with Maya Chen')).toBeVisible();
  });

  test('shows the cancellation policy before cancelling, restores the credit, and keeps the record', async ({ page }) => {
    await signInAsStudent(page);
    await expect(page.getByText('45-minute Lesson with Maya Chen')).toBeVisible();
    await expect(page.getByText('3', { exact: true })).toBeVisible(); // 3 credits remaining

    await page.getByRole('button', { name: 'Cancel session' }).click();
    await expect(page.getByText('your package credit will be returned')).toBeVisible();
    await page.getByRole('button', { name: 'Confirm cancellation' }).click();

    // Booking moves out of Upcoming into Cancelled, and the credit comes back.
    await expect(page.getByText('No upcoming sessions yet.')).toBeVisible();
    await expect(page.getByText('4', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: /^Cancelled \(\d+\)$/ }).click();
    await expect(page.getByText('45-minute Lesson with Maya Chen')).toBeVisible();
    await expect(page.getByText('Credit returned')).toBeVisible();
  });
});
