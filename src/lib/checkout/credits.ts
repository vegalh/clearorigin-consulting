import type { PackageCreditBalance } from '@/types';

export function usedCredits(balance: PackageCreditBalance): number {
  return balance.redemptions.filter((r) => r.status === 'consumed' || r.status === 'forfeited').length;
}

export function remainingCredits(balance: PackageCreditBalance): number {
  return Math.max(0, balance.totalCredits - usedCredits(balance));
}

export function isBalanceExpired(balance: PackageCreditBalance, now: Date): boolean {
  return !!balance.expiresAt && new Date(balance.expiresAt).getTime() <= now.getTime();
}

export function isBalanceRedeemable(balance: PackageCreditBalance, now: Date): boolean {
  return remainingCredits(balance) > 0 && !isBalanceExpired(balance, now);
}
