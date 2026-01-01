import { User } from '@prisma/client';

function normalizedAdmins() {
  const raw = process.env.ADMIN_EMAILS || '';
  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isSystemAdmin(user: Pick<User, 'email'>) {
  if (!user.email) return false;
  const admins = normalizedAdmins();
  return admins.includes(user.email.toLowerCase());
}
