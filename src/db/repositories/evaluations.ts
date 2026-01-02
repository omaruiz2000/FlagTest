import { TestSessionStatus } from '@prisma/client';
import { prisma } from '../prisma';
import { hashInviteToken } from '@/src/auth/inviteTokens';

export function findEvaluationById(id: string) {
  return prisma.evaluation.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
}

export function findEvaluationTests(evaluationId: string) {
  return prisma.evaluationTest.findMany({
    where: { evaluationId },
    orderBy: { sortOrder: 'asc' },
    include: {
      testDefinition: {
        select: {
          id: true,
          title: true,
          slug: true,
          version: true,
        },
      },
    },
  });
}

export async function getEvaluationWithTests(evaluationId: string) {
  const [evaluation, tests] = await Promise.all([
    findEvaluationById(evaluationId),
    findEvaluationTests(evaluationId),
  ]);

  if (!evaluation) return null;

  return { ...evaluation, tests };
}

export function findInviteByTokenWithEvaluation(token: string) {
  const tokenHash = hashInviteToken(token);
  return prisma.invite.findUnique({
    where: { tokenHash },
    include: {
      evaluation: {
        select: {
          id: true,
          name: true,
          status: true,
          tests: {
            orderBy: { sortOrder: 'asc' },
            include: {
              testDefinition: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  version: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function findEvaluationTestStatuses(
  evaluationId: string,
  participantId: string,
  testDefinitionIds: string[],
) {
  if (!participantId || testDefinitionIds.length === 0) {
    return {} as Record<string, { status: TestSessionStatus; hasAnswers: boolean }>;
  }

  const attemptKeys = testDefinitionIds.map((testId) => `open:${evaluationId}:${participantId}:${testId}`);
  const sessions = await prisma.testSession.findMany({
    where: { attemptKey: { in: attemptKeys } },
    select: { attemptKey: true, status: true, _count: { select: { answers: true } } },
  });

  return sessions.reduce<Record<string, { status: TestSessionStatus; hasAnswers: boolean }>>((acc, session) => {
    const segments = session.attemptKey.split(':');
    const testId = segments[segments.length - 1];
    acc[testId] = { status: session.status, hasAnswers: session._count.answers > 0 || session.status === 'ACTIVE' };
    return acc;
  }, {});
}

export async function findInviteTestStatuses(inviteId: string, testDefinitionIds: string[]) {
  if (!inviteId || testDefinitionIds.length === 0) {
    return {} as Record<string, { status: TestSessionStatus; hasAnswers: boolean }>;
  }

  const attemptKeys = testDefinitionIds.map((testId) => `inv:${inviteId}:test:${testId}`);
  const sessions = await prisma.testSession.findMany({
    where: { attemptKey: { in: attemptKeys } },
    select: { attemptKey: true, status: true, _count: { select: { answers: true } } },
  });

  return sessions.reduce<Record<string, { status: TestSessionStatus; hasAnswers: boolean }>>((acc, session) => {
    const segments = session.attemptKey.split(':');
    const testId = segments[segments.length - 1];
    acc[testId] = { status: session.status, hasAnswers: session._count.answers > 0 || session.status === 'ACTIVE' };
    return acc;
  }, {});
}
