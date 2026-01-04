import { NextResponse } from 'next/server';
import { z } from 'zod';
import { JoinError, joinParticipantSession } from '@/src/services/server/join';

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

  try {
    const result = await joinParticipantSession(
      parsed.data.evaluationId,
      parsed.data.inviteToken,
      parsed.data.testDefinitionId,
    );
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof JoinError) {
      const message = error.status === 404 ? 'Invalid code/link' : error.message;
      return NextResponse.json({ error: message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Unable to join' }, { status: 500 });
  }
}
