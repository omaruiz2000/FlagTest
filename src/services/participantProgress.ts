import type { TestSessionStatus } from '@prisma/client';
import { findParticipantTestStatuses } from '@/src/db/repositories/evaluations';

export type ParticipantProgress = {
  statusMap: Record<string, { status: TestSessionStatus; hasAnswers: boolean }>;
  completedTestDefinitionIds: string[];
  nextIncompleteTestDefinitionId: string | null;
};

type OrderedTest = { testDefinitionId: string };

function resolveNextIncomplete(
  orderedTests: OrderedTest[],
  statusMap: ParticipantProgress['statusMap'],
  currentTestDefinitionId?: string,
) {
  if (!orderedTests.length) return null;

  const testIds = orderedTests.map((test) => test.testDefinitionId);
  const startIndex = currentTestDefinitionId ? testIds.indexOf(currentTestDefinitionId) : -1;

  for (let offset = 1; offset <= testIds.length; offset += 1) {
    const index = (startIndex + offset) % testIds.length;
    const testId = testIds[index];
    const statusInfo = statusMap[testId];
    if (statusInfo?.status !== 'COMPLETED') {
      return testId;
    }
  }

  return null;
}

export async function getParticipantProgress(
  evaluationId: string,
  participantToken: string,
  orderedTests: OrderedTest[],
  currentTestDefinitionId?: string,
): Promise<ParticipantProgress> {
  const testDefinitionIds = orderedTests.map((test) => test.testDefinitionId);
  const statusMap = await findParticipantTestStatuses(evaluationId, participantToken, testDefinitionIds);

  const completedTestDefinitionIds = testDefinitionIds.filter(
    (testId) => statusMap[testId]?.status === 'COMPLETED',
  );

  const nextIncompleteTestDefinitionId = completedTestDefinitionIds.length === testDefinitionIds.length
    ? null
    : resolveNextIncomplete(orderedTests, statusMap, currentTestDefinitionId);

  return { statusMap, completedTestDefinitionIds, nextIncompleteTestDefinitionId };
}
