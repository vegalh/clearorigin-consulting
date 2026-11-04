import type { PaymentProvider, PaymentRequest, PaymentResult, SimulatedOutcome } from './types';

const FAILURE_REASONS: Record<Exclude<SimulatedOutcome, 'success'>, string> = {
  failure: 'The simulated payment was declined.',
  cancel: 'You cancelled the simulated payment.',
  timeout: 'The simulated payment did not complete in time.',
};

/**
 * Explicitly simulated provider: the caller chooses the outcome. Results carry
 * a `demo_` reference so they can never be mistaken for a real transaction.
 * `delayMs` mimics a provider round-trip (0 in unit tests).
 */
export function createMockPaymentProvider(options: { outcome: SimulatedOutcome; delayMs?: number }): PaymentProvider {
  const { outcome, delayMs = 0 } = options;
  return {
    id: 'mock',
    async createPayment(request: PaymentRequest): Promise<PaymentResult> {
      if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
      const providerRef = `demo_${request.idempotencyKey.replace(/[^a-zA-Z0-9]/g, '').slice(-10)}`;
      switch (outcome) {
        case 'success':
          return { status: 'succeeded', providerRef };
        case 'failure':
          return { status: 'failed', providerRef, failureReason: FAILURE_REASONS.failure };
        case 'cancel':
          return { status: 'cancelled', providerRef, failureReason: FAILURE_REASONS.cancel };
        case 'timeout':
          return { status: 'timed_out', providerRef, failureReason: FAILURE_REASONS.timeout };
      }
    },
  };
}
