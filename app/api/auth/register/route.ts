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
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const normalizedEmail = parsed.data.email.toLowerCase();
  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    return NextResponse.json({ error: 'Account already exists' }, { status: 409 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await createUser(normalizedEmail, passwordHash);
  await signIn(user.id, readRequestMetadata());

  return NextResponse.json({ message: 'Registered' });
}
