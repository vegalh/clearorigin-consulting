import type { CurrencyCode, PaymentMethodId } from '@/types';
import type { PaymentMethodInfo } from './types';

/**
 * Demo payment methods. These are UI simulations only — nothing here talks to
 * Stripe, WeChat Pay or Alipay, and no credentials are ever collected. Which
 * methods ClearOrigin can actually offer depends on its merchant location and
 * eligibility, so availability per currency is plain configuration.
 */
export const paymentMethods: PaymentMethodInfo[] = [
  {
    id: 'card_demo',
    label: 'Card payment — Demo',
    description: 'Simulates a hosted card checkout. No card details are requested.',
    currencies: ['USD', 'CNY'],
    productionNote: 'Production: provider-hosted card checkout (e.g. Stripe) created by the server.',
  },
  {
    id: 'wechat_pay_demo',
    label: 'WeChat Pay — Demo',
    description: 'Simulates a WeChat Pay checkout. Nothing to scan.',
    currencies: ['CNY'],
    productionNote: 'Production: subject to merchant eligibility and an approved WeChat Pay integration.',
  },
  {
    id: 'alipay_demo',
    label: 'Alipay — Demo',
    description: 'Simulates an Alipay checkout. No account login is requested.',
    currencies: ['CNY'],
    productionNote: 'Production: subject to merchant eligibility and an approved Alipay integration.',
  },
];

export function methodsForCurrency(currency: CurrencyCode): PaymentMethodInfo[] {
  return paymentMethods.filter((m) => m.currencies.includes(currency));
}

export function paymentMethodLabel(id: PaymentMethodId): string {
  return paymentMethods.find((m) => m.id === id)?.label ?? id;
}
