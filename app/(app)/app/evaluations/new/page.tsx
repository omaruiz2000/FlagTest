import { z } from 'zod';
import { redirect } from 'next/navigation';
import { prisma } from '@/src/db/prisma';
import { requireUser } from '@/src/auth/session';
import { generateUniqueInviteCode } from '@/src/db/inviteCodes';
import styles from '../styles.module.css';
import { EvaluationBuilderForm } from './ui';

const createEvaluationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  packageId: z.string().cuid(),
  tests: z.array(z.string().cuid()).min(1, 'Select at least one test'),
  createInvites: z.boolean().optional(),
  inviteCount: z.number().int().min(1).max(500).optional(),
  inviteLabels: z.array(z.string()).optional(),
}).superRefine((data, ctx) => {
  if (data.createInvites && !data.inviteCount) {
    ctx.addIssue({ code: 'custom', message: 'Invite count is required' });
  }
});

async function loadPackages() {
  return prisma.testPackage.findMany({
    where: { isActive: true },
    orderBy: { title: 'asc' },
    include: {
      items: {
        orderBy: { sortOrder: 'asc' },
        include: {
          testDefinition: {
            select: { id: true, title: true, description: true },
          },
        },
      },
    },
  });
}

async function createEvaluationAction(formData: FormData) {
  'use server';

  const user = await requireUser();
  const name = formData.get('name');
  const packageId = formData.get('packageId');
  const tests = formData.getAll('tests');
  const createInvites = formData.get('createInvites') === 'on';
  const inviteCount = Number(formData.get('inviteCount') ?? 0);
  const inviteLabelsRaw = formData.get('inviteLabels');
  const inviteLabels = typeof inviteLabelsRaw === 'string'
    ? inviteLabelsRaw
        .toString()
        .split('\n')
        .map((label) => label.trim())
        .filter(Boolean)
    : [];
  const parsed = createEvaluationSchema.safeParse({
    name: typeof name === 'string' ? name.trim() : '',
    packageId: typeof packageId === 'string' ? packageId : '',
    tests: tests.filter((value): value is string => typeof value === 'string'),
    createInvites,
    inviteCount: createInvites && !Number.isNaN(inviteCount) ? inviteCount : undefined,
    inviteLabels: createInvites ? inviteLabels : [],
  });

  if (!parsed.success) {
    const error = parsed.error.issues.at(0)?.message ?? 'Invalid input';
    return { error };
  }

  const { name: evalName, packageId: evalPackageId, tests: selectedTests } = parsed.data;
  const packageItems = await prisma.testPackageItem.findMany({
    where: { testPackageId: evalPackageId, testDefinitionId: { in: selectedTests } },
    orderBy: { sortOrder: 'asc' },
  });

  if (packageItems.length === 0) {
    return { error: 'No valid tests were selected' };
  }

  const orderedTests = packageItems.map((item) => item.testDefinitionId);
  const evaluation = await prisma.evaluation.create({
    data: {
      name: evalName,
      organizationId: null,
      ownerUserId: user.id,
    },
  });

  await prisma.evaluationTest.createMany({
    data: orderedTests.map((testDefinitionId, index) => ({
      evaluationId: evaluation.id,
      testDefinitionId,
      sortOrder: index,
    })),
  });

  if (parsed.data.createInvites && parsed.data.inviteCount) {
    const invites = [] as { evaluationId: string; code: string; label?: string | null }[];
    const labels = parsed.data.inviteLabels ?? [];
    for (let i = 0; i < parsed.data.inviteCount; i += 1) {
      const code = await generateUniqueInviteCode();
      invites.push({
        evaluationId: evaluation.id,
        code,
        label: labels[i] ?? null,
      });
    }

    if (invites.length) {
      await prisma.evaluationInvite.createMany({ data: invites });
    }
  }

  redirect(`/app/evaluations/${evaluation.id}`);
}

export default async function NewEvaluationPage() {
  await requireUser();
  const packages = await loadPackages();

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <h1>Create evaluation</h1>
        <p>Select a package and choose the tests to include.</p>
      </div>
      <EvaluationBuilderForm packages={packages} action={createEvaluationAction} />
    </section>
  );
}
