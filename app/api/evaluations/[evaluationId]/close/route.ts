import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/src/db/prisma';
import { requireUser } from '@/src/auth/session';
import { isPlatformAdmin } from '@/src/auth/admin';

const schema = z.object({ action: z.enum(['close', 'reopen']).default('close') });

export async function POST(request: Request, { params }: { params: { evaluationId: string } }) {
  const user = await requireUser();
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const evaluation = await prisma.evaluation.findFirst({
    where: { id: params.evaluationId, deletedAt: null },
    select: { id: true, ownerUserId: true },
  });

  if (!evaluation) {
    return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
  }

  if (evaluation.ownerUserId !== user.id && !isPlatformAdmin(user)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const now = new Date();
  const isClosing = parsed.data.action === 'close';

  await prisma.evaluation.update({
    where: { id: evaluation.id },
    data: {
      isClosed: isClosing,
      closedAt: isClosing ? now : null,
      closedByUserId: isClosing ? user.id : null,
    },
  });

  revalidatePath(`/app/evaluations/${evaluation.id}`);
  revalidatePath(`/app/admin/evaluations/${evaluation.id}`);
  revalidatePath('/app/admin/evaluations');
  revalidatePath('/join');

  return NextResponse.json({ ok: true, isClosed: isClosing, closedAt: isClosing ? now : null });
}
