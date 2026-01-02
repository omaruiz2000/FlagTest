import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/src/db/prisma';
import { requireUser } from '@/src/auth/session';
import { isPlatformAdmin } from '@/src/auth/admin';
import { generateParticipantToken, hashParticipantToken } from '@/src/auth/participant';

type ResetRequest = { inviteId: string; testDefinitionId: string };

const schema = z.object({ inviteId: z.string().cuid(), testDefinitionId: z.string().cuid() });

export async function POST(request: Request, { params }: { params: { evaluationId: string } }) {
  const user = await requireUser();
  if (!isPlatformAdmin(user)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body as ResetRequest);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const { inviteId, testDefinitionId } = parsed.data;

  const evaluationTest = await prisma.evaluationTest.findFirst({
    where: { evaluationId: params.evaluationId, testDefinitionId },
    select: { id: true },
  });

  if (!evaluationTest) {
    return NextResponse.json({ error: 'Test not found for evaluation' }, { status: 404 });
  }

  const invite = await prisma.invite.findFirst({ where: { id: inviteId, evaluationId: params.evaluationId } });
  if (!invite) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
  }

  const attemptKey = `inv:${inviteId}:test:${testDefinitionId}`;
  const existingSession = await prisma.testSession.findFirst({
    where: { attemptKey, evaluationId: params.evaluationId, inviteId },
  });

  const tokenHash = hashParticipantToken(generateParticipantToken());
  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const session =
      existingSession ||
      (await tx.testSession.create({
        data: {
          attemptKey,
          evaluationId: params.evaluationId,
          inviteId,
          testDefinitionId,
          participantTokenHash: tokenHash,
          status: 'CREATED',
        },
      }));

    const deletedAnswers = await tx.answer.deleteMany({ where: { testSessionId: session.id } });
    const deletedScores = await tx.score.deleteMany({ where: { testSessionId: session.id } });

    await tx.testSession.update({
      where: { id: session.id },
      data: {
        status: 'CREATED',
        startedAt: null,
        completedAt: null,
        participantTokenHash: tokenHash,
        lastSeenAt: now,
      },
    });

    return { deletedAnswers: deletedAnswers.count, deletedScores: deletedScores.count, sessionId: session.id };
  });

  revalidatePath(`/app/admin/evaluations/${params.evaluationId}`);
  revalidatePath(`/app/evaluations/${params.evaluationId}`);
  revalidatePath('/join');

  return NextResponse.json({ ok: true, ...result });
}
