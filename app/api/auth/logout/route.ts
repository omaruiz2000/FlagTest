import { NextResponse } from 'next/server';
import { signOut } from '@/src/auth/session';

export async function POST() {
  await signOut();
  return NextResponse.json({ message: 'Logged out' });
}
