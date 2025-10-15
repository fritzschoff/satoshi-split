import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('wallet_address');
    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to clear cookie' },
      { status: 500 }
    );
  }
}
