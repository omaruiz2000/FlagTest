import { prisma } from '../prisma';

export async function createSession(data: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}) {
  return prisma.authSession.create({ data });
}

export async function deleteSessionByTokenHash(tokenHash: string) {
  return prisma.authSession.delete({ where: { tokenHash } }).catch(() => null);
}

export async function deleteSessionById(id: string) {
  return prisma.authSession.delete({ where: { id } }).catch(() => null);
}

export async function findSessionWithUserByTokenHash(tokenHash: string) {
  return prisma.authSession.findUnique({ where: { tokenHash }, include: { user: true } });
}

export async function touchSession(id: string) {
  return prisma.authSession.update({ where: { id }, data: { lastUsedAt: new Date() } });
}
