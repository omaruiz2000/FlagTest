import { NextResponse } from 'next/server';
import { z } from 'zod';
import { setParticipantCookie } from '@/src/auth/participant';
import { JoinError, joinSchoolSession } from '@/src/services/server/join';

const joinSchema = z.object({
  evaluationId: z.string().cuid(),
  rosterEntryId: z.string().cuid(),
  testDefinitionId: z.string().cuid(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = joinSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid join request' }, { status: 400 });
  }

  try {
    const { token, sessionId, status } = await joinSchoolSession(
      parsed.data.evaluationId,
      parsed.data.rosterEntryId,
      parsed.data.testDefinitionId,
    );

    setParticipantCookie(sessionId, token);
    return NextResponse.json({ sessionId, status });
  } catch (error) {
    if (error instanceof JoinError) {
      const message = error.status === 400 ? 'Invalid code' : error.message;
      return NextResponse.json({ error: message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Unable to join' }, { status: 500 });
  }
}
