import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/src/db/prisma';
import { hashInviteToken } from '@/src/auth/inviteTokens';
import { generateParticipantToken, hashParticipantToken, setParticipantCookie } from '@/src/auth/participant';

const joinSchema = z.object({
  evaluationId: z.string().cuid(),
  inviteToken: z.string().min(1),
  testDefinitionId: z.string().cuid(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = joinSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid join request' }, { status: 400 });
  }

  const { evaluationId, inviteToken, testDefinitionId } = parsed.data;
  const invite = await prisma.invite.findUnique({
    where: { tokenHash: hashInviteToken(inviteToken) },
    include: {
      evaluation: {
        include: {
          tests: { select: { testDefinitionId: true } },
        },
      },
    },
  });

  if (!invite || !invite.evaluation || invite.evaluationId !== evaluationId) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
  }

  const allowedTests = invite.evaluation.tests.map((test) => test.testDefinitionId);
  if (!allowedTests.includes(testDefinitionId)) {
    return NextResponse.json({ error: 'Test not available for this invite' }, { status: 404 });
  }

  const attemptKey = `inv:${invite.id}:test:${testDefinitionId}`;
  const existingSession = await prisma.testSession.findUnique({ where: { attemptKey } });

  if (!existingSession && invite.evaluation.status === 'ARCHIVED') {
    return NextResponse.json({ error: 'Evaluation closed' }, { status: 409 });
  }

  if (existingSession?.status === 'COMPLETED') {
    return NextResponse.json({ error: 'Test already completed' }, { status: 409 });
  }

  const token = generateParticipantToken();
  const tokenHash = hashParticipantToken(token);

  const session = existingSession
    ? await prisma.testSession.update({
        where: { id: existingSession.id },
        data: { participantTokenHash: tokenHash, lastSeenAt: new Date() },
      })
    : await prisma.testSession.create({
        data: {
          attemptKey,
          participantTokenHash: tokenHash,
          testDefinitionId,
          evaluationId,
          inviteId: invite.id,
          status: 'CREATED',
        },
      });

  setParticipantCookie(session.id, token);
  return NextResponse.json({ sessionId: session.id, status: session.status });
}
