import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/src/db/prisma';
import { generateParticipantToken, hashParticipantToken, setParticipantCookie } from '@/src/auth/participant';

const joinSchema = z.object({
  code: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = joinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
  }

  const code = parsed.data.code.trim();
  const studentCount = await prisma.studentRecord.count();
  const studentRecord = await prisma.studentRecord.findUnique({ where: { code } });

  if (!studentRecord && !(studentCount === 0 && code.toUpperCase() === 'DEMO')) {
    return NextResponse.json({ error: 'Code not recognized' }, { status: 404 });
  }

  const testDefinition = await prisma.testDefinition.findFirst({
    where: { slug: 'scenario-demo' },
    orderBy: { version: 'desc' },
  });

  if (!testDefinition) {
    return NextResponse.json({ error: 'No demo test available' }, { status: 500 });
  }

  const attemptKey = `student:${studentRecord?.id ?? 'demo'}:test:${testDefinition.id}:eval:${'none'}`;
  const existingSession = await prisma.testSession.findUnique({ where: { attemptKey } });

  if (existingSession?.status === 'COMPLETED') {
    return NextResponse.json({ error: 'Already completed' }, { status: 409 });
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
          testDefinitionId: testDefinition.id,
          studentRecordId: studentRecord?.id,
        },
      });

  setParticipantCookie(session.id, token);

  return NextResponse.json({ sessionId: session.id });
}
