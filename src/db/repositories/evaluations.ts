import { TestSessionStatus } from '@prisma/client';
import { prisma } from '../prisma';

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

export function findInviteByCodeWithEvaluation(code: string) {
  return prisma.evaluationInvite.findUnique({
    where: { code },
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
    return {} as Record<string, string>;
  }

  const attemptKeys = testDefinitionIds.map((testId) => `open:${evaluationId}:${participantId}:${testId}`);
  const sessions = await prisma.testSession.findMany({
    where: { attemptKey: { in: attemptKeys } },
    select: { attemptKey: true, status: true },
  });

  return sessions.reduce<Record<string, string>>((acc, session) => {
    const segments = session.attemptKey.split(':');
    const testId = segments[segments.length - 1];
    acc[testId] = session.status;
    return acc;
  }, {});
}

export async function findInviteTestStatuses(inviteId: string, testDefinitionIds: string[]) {
  if (!inviteId || testDefinitionIds.length === 0) {
    return {} as Record<string, string>;
  }

  const attemptKeys = testDefinitionIds.map((testId) => `inv:${inviteId}:${testId}`);
  const sessions = await prisma.testSession.findMany({
    where: { attemptKey: { in: attemptKeys } },
    select: { attemptKey: true, status: true },
  });

  return sessions.reduce<Record<string, TestSessionStatus>>((acc, session) => {
    const segments = session.attemptKey.split(':');
    const testId = segments[segments.length - 1];
    acc[testId] = session.status;
    return acc;
  }, {});
}
