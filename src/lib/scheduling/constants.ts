/** Every generated slot starts on a consistent grid, regardless of duration. */
export const SLOT_INTERVAL_MINUTES = 15;

/** How many days into the future to generate availability for. */
export const AVAILABILITY_HORIZON_DAYS = 56;

export const MINUTE_MS = 60 * 1000;
export const SLOT_INTERVAL_MS = SLOT_INTERVAL_MINUTES * MINUTE_MS;
