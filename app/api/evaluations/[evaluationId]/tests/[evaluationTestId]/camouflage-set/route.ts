import { NextResponse } from 'next/server';
import { prisma } from '@/src/db/prisma';
import { requireUser } from '@/src/auth/session';

export async function POST(req: Request, { params }: { params: { evaluationId: string; evaluationTestId: string } }) {
  const user = await requireUser();
  const { evaluationId, evaluationTestId } = params;

  const evaluationTest = await prisma.evaluationTest.findFirst({
    where: {
      id: evaluationTestId,
      evaluationId,
      evaluation: { ownerUserId: user.id },
    },
    include: {
      evaluation: { select: { participantFeedbackMode: true } },
      testDefinition: {
        select: {
          camouflageOptions: {
            where: { isActive: true },
            select: { camouflageSetId: true },
          },
        },
      },
    },
  });

  if (!evaluationTest) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (evaluationTest.evaluation.participantFeedbackMode !== 'CAMOUFLAGE') {
    return NextResponse.json({ error: 'Camouflage mode disabled' }, { status: 400 });
  }

  const contentType = req.headers.get('content-type') || '';
  let camouflageSetId: string | null = null;

  if (contentType.includes('application/json')) {
    const body = await req.json().catch(() => undefined);
    if (body && typeof body.camouflageSetId === 'string') {
      camouflageSetId = body.camouflageSetId;
    }
  } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const formData = await req.formData();
    const rawValue = formData.get('camouflageSetId');
    if (typeof rawValue === 'string') {
      camouflageSetId = rawValue || null;
    }
  }

  if (camouflageSetId) {
    const allowed = evaluationTest.testDefinition.camouflageOptions.some(
      (option) => option.camouflageSetId === camouflageSetId,
    );
    if (!allowed) {
      return NextResponse.json({ error: 'Camouflage set not allowed for this test' }, { status: 400 });
    }
  }

  await prisma.evaluationTest.update({
    where: { id: evaluationTest.id },
    data: { camouflageSetId: camouflageSetId || null },
  });

  return NextResponse.json({ ok: true });
}
