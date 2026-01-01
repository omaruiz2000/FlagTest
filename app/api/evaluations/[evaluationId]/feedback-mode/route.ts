import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/src/db/prisma';
import { requireUser } from '@/src/auth/session';

const schema = z.object({ mode: z.enum(['THANK_YOU_ONLY', 'CAMOUFLAGE']) });

export async function POST(request: Request, { params }: { params: { evaluationId: string } }) {
  const user = await requireUser();
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
  }

  const evaluation = await prisma.evaluation.findFirst({
    where: { id: params.evaluationId, ownerUserId: user.id },
    select: { id: true },
  });

  if (!evaluation) {
    return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
  }

  await prisma.evaluation.update({
    where: { id: evaluation.id },
    data: { participantFeedbackMode: parsed.data.mode },
  });

  return NextResponse.json({ ok: true, mode: parsed.data.mode });
}
