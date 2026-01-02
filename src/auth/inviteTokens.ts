import crypto from 'crypto';

export function generateInviteToken(length = 32) {
  const bytes = Math.max(16, length);
  return crypto.randomBytes(bytes).toString('base64url').slice(0, length);
}

export function hashInviteToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
