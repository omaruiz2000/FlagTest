import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/src/db/prisma';
import { findSchoolTestStatuses } from '@/src/db/repositories/evaluations';
import { isRateLimited } from '@/src/utils/rateLimit';

const lookupSchema = z.object({
  evaluationId: z.string().cuid(),
  studentCode: z.string().min(1),
});

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const body = await request.json().catch(() => ({}));
  const parsed = lookupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
  }

  if (isRateLimited(`join:${ip}`)) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 429 });
  }

  const evaluation = await prisma.evaluation.findFirst({
    where: { id: parsed.data.evaluationId, deletedAt: null },
    select: {
      id: true,
      status: true,
      testPackage: { select: { slug: true } },
      tests: { select: { testDefinitionId: true } },
    },
  });

  if (!evaluation || evaluation.testPackage?.slug !== 'school-bundle' || evaluation.status === 'DRAFT') {
    return NextResponse.json({ error: 'Invalid code' }, { status: 404 });
  }

  const rosterEntry = await prisma.evaluationRosterEntry.findUnique({
    where: { evaluationId_code: { evaluationId: evaluation.id, code: parsed.data.studentCode.trim() } },
    select: { id: true },
  });

  if (!rosterEntry) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
  }

  const statusMap = await findSchoolTestStatuses(
    evaluation.id,
    rosterEntry.id,
    evaluation.tests.map((test) => test.testDefinitionId),
  );

  return NextResponse.json({ rosterEntryId: rosterEntry.id, statusMap, evaluationStatus: evaluation.status });
}
