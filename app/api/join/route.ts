import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/src/db/prisma';
import { JoinError, joinParticipantSession } from '@/src/services/server/join';
import { rateLimitByIp } from '@/src/utils/rateLimit';

const joinSchema = z.object({
  inv: z.string().min(1),
  evaluationId: z.string().cuid(),
  testDefinitionId: z.string().cuid().optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const url = new URL(request.url);
  const parsed = joinSchema.safeParse({
    ...body,
    inv: body.inv ?? url.searchParams.get('inv') ?? url.searchParams.get('code') ?? undefined,
    evaluationId: body.evaluationId ?? url.searchParams.get('e') ?? undefined,
    testDefinitionId: body.testDefinitionId ?? url.searchParams.get('t') ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid join request' }, { status: 400 });
  }

  const inv = parsed.data.inv.trim();
  const evaluationId = parsed.data.evaluationId;
  const testDefinitionId = parsed.data.testDefinitionId;

  if (!testDefinitionId) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const allowed = rateLimitByIp(ip, 5, 60_000);
    if (!allowed) {
      return NextResponse.json({ error: 'Invalid code/link' }, { status: 429 });
    }

    const evaluation = await prisma.evaluation.findFirst({
      where: { id: evaluationId, deletedAt: null },
      select: {
        status: true,
        _count: { select: { rosterEntries: true } },
        rosterEntries: { where: { studentCode: inv }, select: { id: true } },
      },
    });

    if (!evaluation || evaluation.status === 'DRAFT') {
      return NextResponse.json({ error: 'Invalid code/link' }, { status: 404 });
    }

    const isSchool = evaluation._count.rosterEntries > 0;
    if (!isSchool || evaluation.rosterEntries.length === 0) {
      return NextResponse.json({ error: 'Invalid code/link' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  }

  try {
    const result = await joinParticipantSession(evaluationId, inv, testDefinitionId);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof JoinError) {
      const message = error.status === 404 ? 'Invalid code/link' : error.message;
      return NextResponse.json({ error: message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Unable to join' }, { status: 500 });
  }
}
