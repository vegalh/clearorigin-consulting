import type { CurrencyCode, Money, PaymentMethodId, PaymentStatus } from '@/types';

/** Outcome a demo user can pick at checkout. Production providers decide this themselves. */
export type SimulatedOutcome = 'success' | 'failure' | 'cancel' | 'timeout';

export interface PaymentRequest {
  orderId: string;
  idempotencyKey: string;
  amount: Money;
  method: PaymentMethodId;
}

/** Terminal result reported by a provider (in production: by a verified webhook, never the client). */
export interface PaymentResult {
  status: Exclude<PaymentStatus, 'processing'>;
  providerRef: string;
  failureReason?: string;
}

/**
 * Provider abstraction. V3 ships only `mockPaymentProvider`; a Stripe or
 * WeChat Pay / Alipay adapter would implement the same shape server-side,
 * with `createPayment` returning a hosted-checkout session and the result
 * arriving through a verified webhook.
 */
export interface PaymentProvider {
  id: string;
  createPayment(request: PaymentRequest): Promise<PaymentResult>;
}

export interface PaymentMethodInfo {
  id: PaymentMethodId;
  label: string;
  description: string;
  /** Currencies this method is configured for in the demo. Real availability depends on ClearOrigin's merchant setup. */
  currencies: CurrencyCode[];
  productionNote: string;
}
