import { prisma } from '@/src/db/prisma';
import { hashInviteToken } from '@/src/auth/inviteTokens';
import { generateParticipantToken, hashParticipantToken, setParticipantCookie } from '@/src/auth/participant';
import { buildAttemptKey } from '../attemptKey';

export class JoinError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
    this.name = 'JoinError';
  }
}

export async function joinParticipantSession(
  evaluationId: string,
  participantToken: string,
  testDefinitionId: string,
) {
  const evaluation = await prisma.evaluation.findFirst({
    where: { id: evaluationId, deletedAt: null },
    select: {
      id: true,
      status: true,
      tests: { select: { testDefinitionId: true } },
      invites: {
        where: { tokenHash: hashInviteToken(participantToken) },
        select: { id: true, token: true, alias: true },
      },
      rosterEntries: {
        where: { studentCode: participantToken },
        select: { id: true, studentCode: true },
      },
      _count: { select: { rosterEntries: true } },
    },
  });

  if (!evaluation) {
    throw new JoinError('Evaluation not found', 404);
  }

  if (evaluation.status === 'DRAFT') {
    throw new JoinError('Evaluation not found', 404);
  }

  const allowed = evaluation.tests.some((test) => test.testDefinitionId === testDefinitionId);
  if (!allowed) {
    throw new JoinError('Test not available for this evaluation', 404);
  }

  const isSchool = evaluation._count.rosterEntries > 0;
  const rosterEntry = evaluation.rosterEntries.at(0) ?? null;
  const invite = evaluation.invites.at(0) ?? null;

  if (evaluation.status === 'CLOSED') {
    throw new JoinError('Evaluation closed', 409);
  }

  if (isSchool) {
    if (!rosterEntry) {
      throw new JoinError('Invite not found', 404);
    }
  } else if (!invite) {
    throw new JoinError('Invite not found', 404);
  }

  const attemptKey = buildAttemptKey(evaluation.id, testDefinitionId, participantToken);
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
          inviteId: invite?.id,
          rosterEntryId: rosterEntry?.id,
          status: 'CREATED',
        },
      });

  setParticipantCookie(session.id, token);
  return { sessionId: session.id, status: session.status };
}
