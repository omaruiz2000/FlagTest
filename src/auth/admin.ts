import { User } from '@prisma/client';
import { redirect } from 'next/navigation';
import { requireUser } from './session';

export function parseAdminEmails() {
  const raw = process.env.ADMIN_EMAILS || '';
  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isPlatformAdmin(user?: Pick<User, 'email'> | null) {
  if (!user?.email) return false;
  const admins = parseAdminEmails();
  if (!admins.length) return false;
  return admins.includes(user.email.toLowerCase());
}

export async function requirePlatformAdmin() {
  const user = await requireUser();
  if (!isPlatformAdmin(user)) {
    redirect('/app?message=not-authorized');
  }
  return user;
}
