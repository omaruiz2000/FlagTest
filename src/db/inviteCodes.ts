import crypto from 'crypto';
import { prisma } from './prisma';

function buildCandidate(length = 10) {
  const targetLength = Math.min(Math.max(length, 8), 10);
  let candidate = crypto.randomBytes(8).toString('base64url').replace(/[^A-Za-z0-9]/g, '');

  while (candidate.length < targetLength) {
    candidate += crypto.randomBytes(4).toString('base64url').replace(/[^A-Za-z0-9]/g, '');
  }

  return candidate.slice(0, targetLength);
}

/**
 * Generate a URL-safe invite code and ensure uniqueness in the database.
 */
export async function generateUniqueInviteCode(length = 10) {
  const attempts = 5;
  for (let i = 0; i < attempts; i += 1) {
    const code = buildCandidate(length);
    const existing = await prisma.evaluationInvite.findUnique({ where: { code } });
    if (!existing) {
      return code;
    }
  }
  throw new Error('Unable to generate a unique invite code');
}
