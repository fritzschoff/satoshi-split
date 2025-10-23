import {
  TOKEN_SYMBOLS,
  TOKEN_DECIMALS,
  TOKEN_ADDRESSES,
} from '@/constants/tokens';

export function getTokenSymbol(tokenAddress: string | undefined | null) {
  if (!tokenAddress) return '';
  const lower = tokenAddress.toLowerCase();
  return TOKEN_SYMBOLS[lower] || lower.slice(0, 6);
}

export function getTokenDecimals(tokenAddress: string | undefined | null) {
  if (!tokenAddress) return 18;
  const lower = tokenAddress.toLowerCase();
  return TOKEN_DECIMALS[lower] ?? 18;
}

export function formatTokenAmount(amount: string | number, decimals: number) {
  if (isNaN(Number(amount)) || Number(amount) === 0 || amount === '0')
    return '0.00';
  const amountInNumber = Number(amount) / 10 ** decimals;
  return amountInNumber.toFixed(2) === '0.00'
    ? '<0.01'
    : amountInNumber.toFixed(2);
}

export function getTokenAddress(tokenSymbol: string) {
  return TOKEN_ADDRESSES[tokenSymbol as keyof typeof TOKEN_ADDRESSES];
}
