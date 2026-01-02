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

  const invites = await prisma.invite.findMany({
    where: { evaluationId: evaluation.id },
    orderBy: { createdAt: 'asc' },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const rows = invites.map((invite) => {
    const alias = invite.alias ?? '';
    const link = `${baseUrl}/join?e=${evaluation.id}&inv=${invite.token}`;
    return [alias, link, invite.token].map(escapeCsv).join(',');
  });

  const csv = ['alias,link,inviteToken', ...rows].join('\n');
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${evaluation.id}-invites.csv"`,
    },
  });
}
