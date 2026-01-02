import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/src/db/prisma';
import { requireUser } from '@/src/auth/session';
import { isPlatformAdmin } from '@/src/auth/admin';

const schema = z.object({ status: z.enum(['DRAFT', 'OPEN', 'CLOSED']) });

export async function POST(request: Request, { params }: { params: { evaluationId: string } }) {
  const user = await requireUser();
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
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
  const nextStatus = parsed.data.status;
  const isClosing = nextStatus === 'CLOSED';

  await prisma.evaluation.update({
    where: { id: evaluation.id },
    data: {
      status: nextStatus,
      isClosed: isClosing,
      closedAt: isClosing ? now : null,
      closedByUserId: isClosing ? user.id : null,
    },
  });

  revalidatePath(`/app/evaluations/${evaluation.id}`);
  revalidatePath(`/app/admin/evaluations/${evaluation.id}`);
  revalidatePath('/app/admin/evaluations');
  revalidatePath('/join');

  return NextResponse.json({ ok: true, status: nextStatus, closedAt: isClosing ? now : null });
}
