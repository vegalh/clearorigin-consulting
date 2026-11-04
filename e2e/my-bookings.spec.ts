import { test, expect } from '@playwright/test';

test.describe('My Bookings - cancel & reschedule (seeded demo data)', () => {
  test('shows seeded bookings split across tabs', async ({ page }) => {
    await page.goto('/bookings');
    await expect(page.getByRole('heading', { name: 'My Learning Space' })).toBeVisible();

    // Seeded demo data gives student-alex exactly one upcoming, one past
    // (completed), and one cancelled booking.
    await expect(page.getByRole('button', { name: /^Upcoming \(\d+\)$/ })).toBeVisible();
    await page.getByRole('button', { name: /^Past \(\d+\)$/ }).click();
    await expect(page.getByText('Conversation Practice with Liang Wu')).toBeVisible();

    await page.getByRole('button', { name: /^Cancelled \(\d+\)$/ }).click();
    await expect(page.getByText('Discovery Conversation with David Okafor')).toBeVisible();

    await page.getByRole('button', { name: /^Upcoming \(\d+\)$/ }).click();
    await expect(page.getByText('Conversation Practice with Maya Chen')).toBeVisible();
  });

  test('can reschedule the upcoming booking to a different time', async ({ page }) => {
    await page.goto('/bookings');
    await expect(page.getByText('Conversation Practice with Maya Chen')).toBeVisible();

    await page.getByRole('button', { name: 'Reschedule' }).click();
    await expect(page.getByText('Choose a new time with Maya Chen')).toBeVisible();

    const timeButtons = page.locator('div.grid.grid-cols-3 button, div.grid.grid-cols-4 button');
    await expect(timeButtons.first()).toBeVisible();
    await timeButtons.first().click();

    await page.getByRole('button', { name: 'Confirm new time' }).click();

    // Reschedule form closes back to the normal row view on success.
    await expect(page.getByText('Choose a new time with Maya Chen')).toHaveCount(0);
    await expect(page.getByText('Conversation Practice with Maya Chen')).toBeVisible();
  });

  test('can cancel the upcoming booking', async ({ page }) => {
    await page.goto('/bookings');
    await expect(page.getByText('Conversation Practice with Maya Chen')).toBeVisible();

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Cancel session' }).click();

    // Booking moves out of Upcoming into Cancelled.
    await expect(page.getByText('No upcoming sessions yet.')).toBeVisible();
    await page.getByRole('button', { name: /^Cancelled \(\d+\)$/ }).click();
    await expect(page.getByText('Conversation Practice with Maya Chen')).toBeVisible();
  });
});
