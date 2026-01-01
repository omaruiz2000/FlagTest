import { NextResponse } from 'next/server';
import { prisma } from '@/src/db/prisma';
import { requireUser } from '@/src/auth/session';

function escapeCsv(value: string) {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(_request: Request, { params }: { params: { evaluationId: string } }) {
  const user = await requireUser();
  const evaluation = await prisma.evaluation.findFirst({
    where: { id: params.evaluationId, ownerUserId: user.id },
  });

  if (!evaluation) {
    return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
  }

  const invites = await prisma.evaluationInvite.findMany({
    where: { evaluationId: evaluation.id },
    orderBy: { createdAt: 'asc' },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const rows = invites.map((invite) => {
    const label = invite.label ?? '';
    const link = `${baseUrl}/join?inv=${invite.code}`;
    return [label, link, invite.code].map(escapeCsv).join(',');
  });

  const csv = ['label,link,inviteCode', ...rows].join('\n');
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${evaluation.id}-invites.csv"`,
    },
  });
}
