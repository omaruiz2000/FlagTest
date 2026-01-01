import { cookies } from 'next/headers';
import crypto from 'crypto';
import { getEnv } from '../env';

const PARTICIPANT_COOKIE = 'ft_participant';

export type ParticipantCookie = {
  sessionId: string;
  token: string;
};

function hashToken(token: string, secret: string) {
  return crypto.createHmac('sha256', secret).update(token).digest('hex');
}

export function generateParticipantToken() {
  return crypto.randomBytes(24).toString('hex');
}

export function setParticipantCookie(sessionId: string, token: string) {
  cookies().set(PARTICIPANT_COOKIE, `${sessionId}:${token}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}

export function readParticipantCookie(): ParticipantCookie | null {
  const raw = cookies().get(PARTICIPANT_COOKIE)?.value;
  if (!raw) return null;
  const [sessionId, token] = raw.split(':');
  if (!sessionId || !token) return null;
  return { sessionId, token };
}

export function hashParticipantToken(token: string) {
  const { AUTH_SECRET } = getEnv();
  return hashToken(token, AUTH_SECRET);
}

export function verifyParticipantTokenHash(token: string, tokenHash?: string | null) {
  if (!tokenHash) return false;
  return hashParticipantToken(token) === tokenHash;
}
