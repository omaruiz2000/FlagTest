import crypto from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from '@/src/db/prisma';
import { hashInviteToken } from '@/src/auth/inviteTokens';
import { generateParticipantToken, hashParticipantToken, setParticipantCookie } from '@/src/auth/participant';
import { SCHOOL_PACKAGE_SLUG } from '@/src/constants/packages';

export class JoinError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
    this.name = 'JoinError';
  }
}

function ensureEvaluationParticipantId(evaluationId: string) {
  const participantCookieName = `ft_pid_${evaluationId}`;
  let participantId = cookies().get(participantCookieName)?.value;
  if (!participantId) {
    participantId = crypto.randomUUID();
    cookies().set(participantCookieName, participantId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
  }
  return participantId;
}

export async function joinEvaluationSession(evaluationId: string, testDefinitionId: string) {
  const evaluation = await prisma.evaluation.findFirst({
    where: { id: evaluationId, deletedAt: null },
    select: {
      id: true,
      status: true,
      testPackage: { select: { slug: true } },
      tests: { select: { testDefinitionId: true } },
    },
  });

  if (!evaluation) {
    throw new JoinError('Evaluation not found', 404);
  }

  if (evaluation.testPackage?.slug === SCHOOL_PACKAGE_SLUG) {
    throw new JoinError('Evaluation not found', 404);
  }

  if (evaluation.status === 'DRAFT') {
    throw new JoinError('Evaluation not found', 404);
  }

  if (evaluation.status === 'CLOSED') {
    throw new JoinError('Evaluation closed', 409);
  }

  const allowed = evaluation.tests.some((test) => test.testDefinitionId === testDefinitionId);
  if (!allowed) {
    throw new JoinError('Test not available for this evaluation', 404);
  }

  const participantId = ensureEvaluationParticipantId(evaluationId);
  const attemptKey = `open:${evaluationId}:${participantId}:${testDefinitionId}`;
  const existingSession = await prisma.testSession.findUnique({ where: { attemptKey } });

  if (existingSession?.status === 'COMPLETED') {
    throw new JoinError('Already completed', 409);
  }

  const token = generateParticipantToken();
  const tokenHash = hashParticipantToken(token);
  const now = new Date();

  const session = existingSession
    ? await prisma.testSession.update({
        where: { id: existingSession.id },
        data: { participantTokenHash: tokenHash, lastSeenAt: now },
      })
    : await prisma.testSession.create({
        data: {
          attemptKey,
          participantTokenHash: tokenHash,
          testDefinitionId,
          evaluationId,
          status: 'CREATED',
        },
      });

  setParticipantCookie(session.id, token);
  return { sessionId: session.id, status: session.status };
}

export async function joinInviteSession(evaluationId: string, inviteToken: string, testDefinitionId: string) {
  const invite = await prisma.invite.findUnique({
    where: { tokenHash: hashInviteToken(inviteToken) },
    include: {
      evaluation: {
        include: {
          testPackage: { select: { slug: true } },
          tests: { select: { testDefinitionId: true } },
        },
      },
    },
  });

  if (!invite || !invite.evaluation || invite.evaluationId !== evaluationId) {
    throw new JoinError('Invite not found', 404);
  }

  if (invite.evaluation.testPackage?.slug === SCHOOL_PACKAGE_SLUG) {
    throw new JoinError('Invite not found', 404);
  }

  if (invite.evaluation.status === 'DRAFT') {
    throw new JoinError('Invite not found', 404);
  }

  if (invite.evaluation.status === 'CLOSED') {
    throw new JoinError('Evaluation closed', 409);
  }

  const allowedTests = invite.evaluation.tests.map((test) => test.testDefinitionId);
  if (!allowedTests.includes(testDefinitionId)) {
    throw new JoinError('Test not available for this invite', 404);
  }

  const attemptKey = `inv:${invite.id}:test:${testDefinitionId}`;
  const existingSession = await prisma.testSession.findUnique({ where: { attemptKey } });

  if (existingSession?.status === 'COMPLETED') {
    throw new JoinError('Test already completed', 409);
  }

  const token = generateParticipantToken();
  const tokenHash = hashParticipantToken(token);
  const now = new Date();

  const session = existingSession
    ? await prisma.testSession.update({
        where: { id: existingSession.id },
        data: { participantTokenHash: tokenHash, lastSeenAt: now },
      })
    : await prisma.testSession.create({
        data: {
          attemptKey,
          participantTokenHash: tokenHash,
          testDefinitionId,
          evaluationId,
          inviteId: invite.id,
          status: 'CREATED',
        },
      });

  setParticipantCookie(session.id, token);
  return { sessionId: session.id, status: session.status };
}

export async function joinSchoolSession(evaluationId: string, rosterEntryId: string, testDefinitionId: string) {
  const evaluation = await prisma.evaluation.findFirst({
    where: { id: evaluationId, deletedAt: null },
    select: {
      id: true,
      status: true,
      testPackage: { select: { slug: true } },
      tests: { select: { testDefinitionId: true } },
    },
  });

  if (!evaluation || evaluation.testPackage?.slug !== SCHOOL_PACKAGE_SLUG) {
    throw new JoinError('Evaluation not found', 404);
  }

  if (evaluation.status === 'DRAFT') {
    throw new JoinError('Evaluation not found', 404);
  }

  if (evaluation.status === 'CLOSED') {
    throw new JoinError('Evaluation closed', 409);
  }

  const allowed = evaluation.tests.some((test) => test.testDefinitionId === testDefinitionId);
  if (!allowed) {
    throw new JoinError('Test not available for this evaluation', 404);
  }

  const rosterEntry = await prisma.evaluationRosterEntry.findFirst({
    where: { id: rosterEntryId, evaluationId },
  });

  if (!rosterEntry) {
    throw new JoinError('Invalid code', 400);
  }

  const attemptKey = `school:${evaluationId}:${rosterEntryId}:${testDefinitionId}`;
  const existingSession = await prisma.testSession.findUnique({ where: { attemptKey } });

  if (existingSession?.status === 'COMPLETED') {
    throw new JoinError('Already completed', 409);
  }

  const token = generateParticipantToken();
  const tokenHash = hashParticipantToken(token);
  const now = new Date();

  const session = existingSession
    ? await prisma.testSession.update({
        where: { id: existingSession.id },
        data: { participantTokenHash: tokenHash, lastSeenAt: now },
      })
    : await prisma.testSession.create({
        data: {
          attemptKey,
          participantTokenHash: tokenHash,
          testDefinitionId,
          evaluationId,
          evaluationRosterEntryId: rosterEntry.id,
          status: 'CREATED',
        },
      });

  setParticipantCookie(session.id, token);
  return { sessionId: session.id, status: session.status };
}
