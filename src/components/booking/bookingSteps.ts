export const BOOKING_STEPS = ['Course', 'Schedule', 'Details', 'Payment', 'Confirmation'] as const;
export type BookingStep = (typeof BOOKING_STEPS)[number];
