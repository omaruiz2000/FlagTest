import { NextResponse } from 'next/server';
import { signOut } from '@/src/auth/session';

export async function POST(request: Request) {
  await signOut();
  return NextResponse.redirect(new URL('/auth/login', request.url));
}
