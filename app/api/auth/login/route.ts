import { NextResponse } from 'next/server';
import { z } from 'zod';
import { findUserByEmail } from '@/src/db/repositories/users';
import { signIn, verifyPassword, readRequestMetadata } from '@/src/auth/session';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

async function parseBody(request: Request) {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return request.json();
  }
  const form = await request.formData();
  return Object.fromEntries(form.entries());
}

export async function POST(request: Request) {
  const body = await parseBody(request);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const user = await findUserByEmail(parsed.data.email.toLowerCase());
  if (!user) {
    return NextResponse.redirect(new URL('/auth/login?error=Account%20not%20found', request.url));
  }

  const valid = await verifyPassword(user.passwordHash, parsed.data.password);
  if (!valid) {
    return NextResponse.redirect(new URL('/auth/login?error=Invalid%20credentials', request.url));
  }

  await signIn(user.id, readRequestMetadata());
  return NextResponse.redirect(new URL('/app', request.url));
}
