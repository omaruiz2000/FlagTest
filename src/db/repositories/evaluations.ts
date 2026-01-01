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
