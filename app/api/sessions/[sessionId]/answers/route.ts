import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/src/db/prisma';
import { readParticipantCookie, verifyParticipantTokenHash } from '@/src/auth/participant';
import { validateTestDefinition, widgetRegistry } from '@/src/survey/registry.server';

const answerSchema = z.object({
  questionId: z.string(),
  widgetType: z.string(),
  answer: z.unknown(),
});

export async function POST(request: Request, { params }: { params: { sessionId: string } }) {
  const body = await request.json().catch(() => ({}));
  const parsed = answerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const participant = readParticipantCookie();
  if (!participant || participant.sessionId !== params.sessionId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const session = await prisma.testSession.findUnique({
    where: { id: params.sessionId },
    include: { testDefinition: true, evaluation: { select: { isClosed: true } } },
  });

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  if (session.evaluation?.isClosed) {
    return NextResponse.json({ error: 'Evaluation is closed' }, { status: 409 });
  }

  if (!verifyParticipantTokenHash(participant.token, session.participantTokenHash)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  if (session.status === 'COMPLETED' || session.status === 'CANCELLED') {
    return NextResponse.json({ error: 'Session closed' }, { status: 409 });
  }

  const testDefinition = validateTestDefinition(session.testDefinition.definition);
  const item = testDefinition.items.find((entry) => entry.id === parsed.data.questionId);

  if (!item || item.widgetType !== parsed.data.widgetType) {
    return NextResponse.json({ error: 'Unknown question' }, { status: 400 });
  }

  const registryEntry = widgetRegistry[item.widgetType];
  if (!registryEntry) {
    return NextResponse.json({ error: 'Unsupported widget' }, { status: 400 });
  }

  const answerValidation = registryEntry.answerSchema.safeParse(parsed.data.answer);
  if (!answerValidation.success) {
    return NextResponse.json({ error: 'Invalid answer' }, { status: 400 });
  }

  const now = new Date();

  const { updatedScores, status } = await prisma.$transaction(async (tx) => {
    const sessionUpdateData: Prisma.TestSessionUpdateInput = { lastSeenAt: now };
    let nextStatus = session.status;

    if (session.status === 'CREATED') {
      nextStatus = 'ACTIVE';
      sessionUpdateData.status = 'ACTIVE';
      sessionUpdateData.startedAt = session.startedAt ?? now;
    }

    await tx.answer.upsert({
      where: { testSessionId_questionId: { testSessionId: params.sessionId, questionId: parsed.data.questionId } },
      update: { payload: answerValidation.data },
      create: {
        testSessionId: params.sessionId,
        questionId: parsed.data.questionId,
        payload: answerValidation.data,
      },
    });

    const answers = await tx.answer.findMany({ where: { testSessionId: params.sessionId } });

    const totals: Record<string, number> = {};
    for (const response of answers) {
      const definition = testDefinition.items.find((entry) => entry.id === response.questionId);
      if (!definition) continue;
      const widget = widgetRegistry[definition.widgetType];
      if (!widget) continue;
      const parsedAnswer = widget.answerSchema.safeParse(response.payload);
      if (!parsedAnswer.success) continue;
      const scores = widget.score(parsedAnswer.data, definition);
      scores.forEach(({ dimension, delta }) => {
        totals[dimension] = (totals[dimension] || 0) + delta;
      });
    }

    if (Object.keys(totals).length > 0) {
      await Promise.all(
        Object.entries(totals).map(([dimension, value]) =>
          tx.score.upsert({
            where: { testSessionId_dimension: { testSessionId: params.sessionId, dimension } },
            update: { value },
            create: { testSessionId: params.sessionId, dimension, value },
          }),
        ),
      );
      await tx.score.deleteMany({
        where: {
          testSessionId: params.sessionId,
          dimension: { notIn: Object.keys(totals) },
        },
      });
    } else {
      await tx.score.deleteMany({ where: { testSessionId: params.sessionId } });
    }

    const completed = answers.length >= testDefinition.items.length;
    if (completed) {
      nextStatus = 'COMPLETED';
      sessionUpdateData.status = 'COMPLETED';
      sessionUpdateData.completedAt = now;
    }

    await tx.testSession.update({ where: { id: params.sessionId }, data: sessionUpdateData });

    const scores = await tx.score.findMany({ where: { testSessionId: params.sessionId } });
    return { updatedScores: scores, status: nextStatus };
  });

  return NextResponse.json({ ok: true, scores: updatedScores, status });
}
