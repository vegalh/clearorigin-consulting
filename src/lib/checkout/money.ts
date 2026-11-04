import type { Course, CurrencyCode, Money } from '@/types';

const CURRENCY_SYMBOL: Record<CurrencyCode, string> = { USD: '$', CNY: '¥' };

/** "$40.00 USD" / "¥280.00 CNY" — the currency code is always explicit. */
export function formatMoney(money: Money): string {
  const major = (money.amountMinor / 100).toFixed(2);
  return `${CURRENCY_SYMBOL[money.currency]}${major} ${money.currency}`;
}

/** Currencies this course has a configured price in (never derived by conversion). */
export function configuredCurrencies(course: Course): CurrencyCode[] {
  return (Object.keys(course.prices) as CurrencyCode[]).filter((c) => typeof course.prices[c] === 'number');
}

export function coursePrice(course: Course, currency: CurrencyCode): Money | null {
  const amount = course.prices[currency];
  return typeof amount === 'number' ? { amountMinor: amount, currency } : null;
}

/** Package price ÷ lessons, rounded down to a whole minor unit — display only. */
export function perLessonPrice(course: Course, currency: CurrencyCode): Money | null {
  const total = coursePrice(course, currency);
  if (!total || !course.sessionCount) return null;
  return { amountMinor: Math.floor(total.amountMinor / course.sessionCount), currency };
}
