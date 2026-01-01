import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/src/db/prisma';
import { requireUser } from '@/src/auth/session';
import { isPlatformAdmin } from '@/src/auth/admin';

export async function DELETE(_request: Request, { params }: { params: { evaluationId: string } }) {
  const user = await requireUser();
  if (!isPlatformAdmin(user)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  await prisma.evaluation.delete({ where: { id: params.evaluationId } });
  revalidatePath('/app/admin/evaluations');
  return NextResponse.json({ ok: true });
}
