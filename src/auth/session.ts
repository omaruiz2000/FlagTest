import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import crypto from 'crypto';
import argon2 from 'argon2';
import { getEnv } from '../env';
import { createSession, deleteSessionByTokenHash, findSessionWithUserByTokenHash } from '../db/repositories/authSessions';
import { findUserById } from '../db/repositories/users';

const SESSION_COOKIE = 'ft_session';
const SESSION_TTL_DAYS = 30;

type SignInContext = {
  ipAddress?: string;
  userAgent?: string;
};

function createSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashSessionToken(token: string, secret: string) {
  return crypto.createHmac('sha256', secret).update(token).digest('hex');
}

function getSessionCookie() {
  return cookies().get(SESSION_COOKIE)?.value;
}

function setSessionCookie(token: string, expires: Date) {
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires,
  });
}

function clearSessionCookie() {
  cookies().delete(SESSION_COOKIE);
}

export async function signIn(userId: string, context: SignInContext = {}) {
  const { AUTH_SECRET } = getEnv();
  const token = createSessionToken();
  const tokenHash = hashSessionToken(token, AUTH_SECRET);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await createSession({
    userId,
    tokenHash,
    expiresAt,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  setSessionCookie(token, expiresAt);
}

export async function signOut() {
  const { AUTH_SECRET } = getEnv();
  const token = getSessionCookie();
  if (token) {
    const tokenHash = hashSessionToken(token, AUTH_SECRET);
    await deleteSessionByTokenHash(tokenHash);
  }
  clearSessionCookie();
}

export async function getUser() {
  const { AUTH_SECRET } = getEnv();
  const token = getSessionCookie();
  if (!token) return null;

  const tokenHash = hashSessionToken(token, AUTH_SECRET);
  const session = await findSessionWithUserByTokenHash(tokenHash);
  if (!session) {
    return null;
  }

  if (session.expiresAt.getTime() < Date.now()) {
    return null;
  }

  return session.user;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) {
    redirect('/auth/login');
  }
  const persisted = await findUserById(user.id);
  if (!persisted) {
    redirect('/auth/login');
  }
  return persisted;
}

export async function verifyPassword(hash: string, password: string) {
  return argon2.verify(hash, password);
}

export async function hashPassword(password: string) {
  return argon2.hash(password);
}

export function readRequestMetadata() {
  const headerStore = headers();
  return {
    userAgent: headerStore.get('user-agent') ?? undefined,
    ipAddress: headerStore.get('x-forwarded-for')?.split(',')[0]?.trim(),
  };
}
