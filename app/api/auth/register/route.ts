import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createUser, findUserByEmail } from '@/src/db/repositories/users';
import { hashPassword, signIn, readRequestMetadata } from '@/src/auth/session';

const registerSchema = z.object({
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
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const existing = await findUserByEmail(parsed.data.email.toLowerCase());
  if (existing) {
    return NextResponse.json({ error: 'Account already exists' }, { status: 409 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await createUser(parsed.data.email.toLowerCase(), passwordHash);
  await signIn(user.id, readRequestMetadata());

  const redirectUrl = new URL('/app', request.url);
  return NextResponse.redirect(redirectUrl);
}
