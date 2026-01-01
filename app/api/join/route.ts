import crypto from 'crypto';
import type { StudentRecord, TestDefinition, TestSession } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { prisma } from '@/src/db/prisma';
import { generateParticipantToken, hashParticipantToken, setParticipantCookie } from '@/src/auth/participant';

const inviteJoinSchema = z.object({
  inviteCode: z.string().min(1),
  testDefinitionId: z.string().cuid(),
});

const joinSchema = z.object({
  code: z.string().min(1).optional(),
  evaluationId: z.string().cuid().optional(),
  testDefinitionId: z.string().cuid().optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const url = new URL(request.url);
  const inviteParsed = inviteJoinSchema.safeParse(body);
  const parsed = joinSchema.safeParse({
    ...body,
    evaluationId: body.evaluationId ?? url.searchParams.get('e') ?? undefined,
    testDefinitionId: body.testDefinitionId ?? url.searchParams.get('t') ?? undefined,
  });
  if (!parsed.success && !inviteParsed.success) {
    return NextResponse.json({ error: 'Invalid join request' }, { status: 400 });
  }

  if (inviteParsed.success) {
    const { inviteCode, testDefinitionId } = inviteParsed.data;
    const invite = await prisma.evaluationInvite.findUnique({
      where: { code: inviteCode },
      include: {
        evaluation: {
          include: {
            tests: { select: { testDefinitionId: true } },
          },
        },
      },
    });

    if (!invite || !invite.evaluation) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    const allowedTests = invite.evaluation.tests.map((test) => test.testDefinitionId);
    if (!allowedTests.includes(testDefinitionId)) {
      return NextResponse.json({ error: 'Test not available for this invite' }, { status: 404 });
    }

    const attemptKey = `inv:${invite.id}:${testDefinitionId}`;
    const existingSession = await prisma.testSession.findUnique({ where: { attemptKey } });
    const token = generateParticipantToken();
    const tokenHash = hashParticipantToken(token);

    if (invite.evaluation.status === 'ARCHIVED') {
      if (!existingSession) {
        return NextResponse.json({ error: 'Evaluation closed' }, { status: 409 });
      }

      const updatedSession = await prisma.testSession.update({
        where: { id: existingSession.id },
        data: { participantTokenHash: tokenHash, lastSeenAt: new Date() },
      });
      setParticipantCookie(updatedSession.id, token);
      return NextResponse.json({ sessionId: updatedSession.id, status: updatedSession.status });
    }

    if (existingSession?.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Already completed' }, { status: 409 });
    }

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
            evaluationId: invite.evaluationId,
            inviteId: invite.id,
            status: 'CREATED',
          },
        });

    setParticipantCookie(session.id, token);
    return NextResponse.json({ sessionId: session.id, status: session.status });
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
    const evaluation = await prisma.evaluation.findUnique({ where: { id: evaluationId } });
    if (!evaluation) {
      return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
    }

    const evaluationTest = await prisma.evaluationTest.findFirst({
      where: { evaluationId, testDefinitionId },
      include: { testDefinition: true },
    });

    if (!evaluationTest) {
      return NextResponse.json({ error: 'Test not available for this evaluation' }, { status: 404 });
    }

    testDefinition = evaluationTest.testDefinition;
    const participantCookieName = `ft_pid_${evaluationId}`;
    let participantId = cookies().get(participantCookieName)?.value;
    if (!participantId) {
      participantId = crypto.randomUUID();
      cookies().set(participantCookieName, participantId, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });
    }

    const attemptKey = `open:${evaluationId}:${participantId}:${testDefinitionId}`;
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
            evaluationId,
            status: 'CREATED',
          },
        });

    setParticipantCookie(session.id, token);
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
