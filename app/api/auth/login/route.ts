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
    try {
      return await request.json();
    } catch (error) {
      return {};
    }
  }
  const form = await request.formData();
  const result: Record<string, string> = {};
  form.forEach((value, key) => {
    if (typeof value === 'string') {
      result[key] = value;
    }
  });
  return result;
}

export async function POST(request: Request) {
  const body = await parseBody(request);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const normalizedEmail = parsed.data.email.toLowerCase();
  const user = await findUserByEmail(normalizedEmail);
  if (!user) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const valid = await verifyPassword(user.passwordHash, parsed.data.password);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  await signIn(user.id, readRequestMetadata());
  return NextResponse.json({ message: 'Logged in' });
}
