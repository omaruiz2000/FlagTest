import type { StudentRecord, TestDefinition, TestSession } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/src/db/prisma';
import { JoinError, joinEvaluationSession } from '@/src/services/server/join';
import { generateParticipantToken, hashParticipantToken, setParticipantCookie } from '@/src/auth/participant';

const joinSchema = z.object({
  code: z.string().min(1).optional(),
  evaluationId: z.string().cuid().optional(),
  testDefinitionId: z.string().cuid().optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const url = new URL(request.url);
  const parsed = joinSchema.safeParse({
    ...body,
    evaluationId: body.evaluationId ?? url.searchParams.get('e') ?? undefined,
    testDefinitionId: body.testDefinitionId ?? url.searchParams.get('t') ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid join request' }, { status: 400 });
  }

  const code = parsed.data.code?.trim() ?? '';
  const evaluationId = parsed.data.evaluationId ?? undefined;
  const testDefinitionId = parsed.data.testDefinitionId ?? undefined;

  if ((evaluationId && !testDefinitionId) || (!evaluationId && testDefinitionId)) {
    return NextResponse.json({ error: 'Evaluation and test must be provided together' }, { status: 400 });
  }

  let studentRecord: StudentRecord | null = null;
  let testDefinition: TestDefinition | null = null;
  let session: TestSession | null = null;

  if (evaluationId && testDefinitionId) {
    try {
      const result = await joinEvaluationSession(evaluationId, testDefinitionId);
      return NextResponse.json(result);
    } catch (error) {
      if (error instanceof JoinError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      return NextResponse.json({ error: 'Unable to join' }, { status: 500 });
    }
  } else {
    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const studentCount = await prisma.studentRecord.count();
    studentRecord = await prisma.studentRecord.findUnique({ where: { code } });

    if (!studentRecord && !(studentCount === 0 && code.toUpperCase() === 'DEMO')) {
      return NextResponse.json({ error: 'Code not recognized' }, { status: 404 });
    }

    testDefinition = await prisma.testDefinition.findFirst({
      where: { slug: 'scenario-demo' },
      orderBy: { version: 'desc' },
    });

    if (!testDefinition) {
      return NextResponse.json({ error: 'No demo test available' }, { status: 500 });
    }
  }

  if (!testDefinition) {
    return NextResponse.json({ error: 'No test available' }, { status: 500 });
  }

  if (session) {
    return NextResponse.json({ sessionId: session.id, status: session.status });
  }

  const attemptKey = `participant:${studentRecord?.id ?? (code ? `code:${code}` : 'demo')}:test:${testDefinition.id}:eval:${evaluationId ?? 'none'}`;
  const existingSession = await prisma.testSession.findUnique({ where: { attemptKey } });

  if (existingSession?.status === 'COMPLETED') {
    return NextResponse.json({ error: 'Already completed' }, { status: 409 });
  }

  const token = generateParticipantToken();
  const tokenHash = hashParticipantToken(token);

  session = existingSession
    ? await prisma.testSession.update({
        where: { id: existingSession.id },
        data: { participantTokenHash: tokenHash, lastSeenAt: new Date() },
      })
    : await prisma.testSession.create({
        data: {
          attemptKey,
          participantTokenHash: tokenHash,
          testDefinitionId: testDefinition.id,
          studentRecordId: studentRecord?.id,
        },
      });

  setParticipantCookie(session.id, token);

  return NextResponse.json({ sessionId: session.id });
}
