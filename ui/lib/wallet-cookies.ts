'use server';

import { cookies } from 'next/headers';

const WALLET_ADDRESS_COOKIE = 'wallet_address';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export async function getWalletAddressFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const walletCookie = cookieStore.get(WALLET_ADDRESS_COOKIE);
  return walletCookie?.value || null;
}

export async function setWalletAddressCookie(address: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(WALLET_ADDRESS_COOKIE, address, {
    maxAge: COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax',
  });
}

export async function clearWalletAddressCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(WALLET_ADDRESS_COOKIE);
}
