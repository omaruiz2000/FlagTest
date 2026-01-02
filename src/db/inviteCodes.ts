import { prisma } from './prisma';
import { generateInviteToken, hashInviteToken } from '@/src/auth/inviteTokens';

export async function generateUniqueInviteCode(length = 32) {
  const attempts = 5;
  for (let i = 0; i < attempts; i += 1) {
    const token = generateInviteToken(length);
    const tokenHash = hashInviteToken(token);
    const existing = await prisma.invite.findUnique({ where: { tokenHash } });
    if (!existing) {
      return token;
    }
  }
  throw new Error('Unable to generate a unique invite code');
}
