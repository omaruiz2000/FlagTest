import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/src/db/prisma';
import { requireUser } from '@/src/auth/session';
import { isPlatformAdmin } from '@/src/auth/admin';
import { generateParticipantToken, hashParticipantToken } from '@/src/auth/participant';
import { buildAttemptKey } from '@/src/services/attemptKey';

type ResetRequest = { inviteId?: string; rosterEntryId?: string; testDefinitionId: string };

const schema = z
  .object({
    inviteId: z.string().cuid().optional(),
    rosterEntryId: z.string().cuid().optional(),
    testDefinitionId: z.string().cuid(),
  })
  .refine((payload) => Boolean(payload.inviteId) !== Boolean(payload.rosterEntryId), {
    message: 'Provide inviteId or rosterEntryId',
  });

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

  const { inviteId, rosterEntryId, testDefinitionId } = parsed.data;

  const evaluationTest = await prisma.evaluationTest.findFirst({
    where: { evaluationId: params.evaluationId, testDefinitionId },
    select: { id: true },
  });

  if (!evaluationTest) {
    return NextResponse.json({ error: 'Test not found for evaluation' }, { status: 404 });
  }

  const participantIdentity = inviteId
    ? await prisma.invite.findFirst({ where: { id: inviteId, evaluationId: params.evaluationId } })
    : await prisma.evaluationRosterEntry.findFirst({ where: { id: rosterEntryId, evaluationId: params.evaluationId } });

  if (!participantIdentity) {
    return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
  }

  const participantToken = 'token' in participantIdentity ? participantIdentity.token : participantIdentity.studentCode;

  const attemptKey = buildAttemptKey(params.evaluationId, testDefinitionId, participantToken);
  const existingSession = await prisma.testSession.findFirst({
    where: { attemptKey, evaluationId: params.evaluationId, testDefinitionId },
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
          rosterEntryId,
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
        inviteId,
        rosterEntryId,
      },
    });

    return { deletedAnswers: deletedAnswers.count, deletedScores: deletedScores.count, sessionId: session.id };
  });

  revalidatePath(`/app/admin/evaluations/${params.evaluationId}`);
  revalidatePath(`/app/evaluations/${params.evaluationId}`);
  revalidatePath('/join');

  return NextResponse.json({ ok: true, ...result });
}
