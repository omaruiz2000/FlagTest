import { z } from 'zod';
import { redirect } from 'next/navigation';
import { prisma } from '@/src/db/prisma';
import { requireUser } from '@/src/auth/session';
import { generateInviteToken, hashInviteToken } from '@/src/auth/inviteTokens';
import styles from '../styles.module.css';
import { EvaluationBuilderForm } from './ui';

const createEvaluationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  packageId: z.string().cuid(),
  tests: z.array(z.string().cuid()).min(1, 'Select at least one test'),
  inviteCount: z.number().int().min(1).max(500).default(1),
  inviteLabels: z.array(z.string()).optional(),
  participantFeedbackMode: z.enum(['THANK_YOU_ONLY', 'CAMOUFLAGE']).default('THANK_YOU_ONLY'),
});

function chooseDefaultCamouflageSets(
  orderedTests: string[],
  options: { testDefinitionId: string; camouflageSetId: string }[],
) {
  const used = new Set<string>();
  return orderedTests.reduce<Record<string, string | null>>((acc, testId) => {
    const allowed = options.filter((option) => option.testDefinitionId === testId);
    if (!allowed.length) {
      acc[testId] = null;
      return acc;
    }
    const pick = allowed.find((option) => !used.has(option.camouflageSetId)) ?? allowed[0];
    used.add(pick.camouflageSetId);
    acc[testId] = pick.camouflageSetId;
    return acc;
  }, {});
}

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
  const inviteCount = Number(formData.get('inviteCount') ?? 1);
  const participantFeedbackMode = formData.get('participantFeedbackMode');
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
    inviteCount: Number.isNaN(inviteCount) ? 1 : inviteCount,
    inviteLabels,
    participantFeedbackMode:
      participantFeedbackMode === 'CAMOUFLAGE' || participantFeedbackMode === 'THANK_YOU_ONLY'
        ? participantFeedbackMode
        : 'THANK_YOU_ONLY',
  });

  if (!parsed.success) {
    const error = parsed.error.issues.at(0)?.message ?? 'Invalid input';
    return { error };
  }

  const { name: evalName, packageId: evalPackageId, tests: selectedTests } = parsed.data;
  const { participantFeedbackMode: feedbackMode } = parsed.data;
  const packageItems = await prisma.testPackageItem.findMany({
    where: { testPackageId: evalPackageId, testDefinitionId: { in: selectedTests } },
    orderBy: { sortOrder: 'asc' },
  });

  if (packageItems.length === 0) {
    return { error: 'No valid tests were selected' };
  }

  const orderedTests = packageItems.map((item) => item.testDefinitionId);
  const allowedCamouflageOptions =
    feedbackMode === 'CAMOUFLAGE'
      ? await prisma.testCamouflageOption.findMany({
          where: { testDefinitionId: { in: orderedTests }, isActive: true },
          orderBy: { sortOrder: 'asc' },
          select: { testDefinitionId: true, camouflageSetId: true },
        })
      : [];

  const defaultCamouflageByTest =
    feedbackMode === 'CAMOUFLAGE'
      ? chooseDefaultCamouflageSets(orderedTests, allowedCamouflageOptions)
      : {};
  const evaluation = await prisma.evaluation.create({
    data: {
      name: evalName,
      organizationId: null,
      ownerUserId: user.id,
      participantFeedbackMode: feedbackMode,
    },
  });

  await prisma.evaluationTest.createMany({
    data: orderedTests.map((testDefinitionId, index) => ({
      evaluationId: evaluation.id,
      testDefinitionId,
      sortOrder: index,
      camouflageSetId:
        feedbackMode === 'CAMOUFLAGE' ? defaultCamouflageByTest[testDefinitionId] ?? null : null,
    })),
  });

  const invites = [] as { evaluationId: string; token: string; tokenHash: string; alias?: string | null }[];
  const labels = parsed.data.inviteLabels ?? [];
  for (let i = 0; i < parsed.data.inviteCount; i += 1) {
    const token = generateInviteToken();
    invites.push({
      evaluationId: evaluation.id,
      token,
      tokenHash: hashInviteToken(token),
      alias: labels[i] ?? null,
    });
  }

  if (invites.length) {
    await prisma.invite.createMany({ data: invites });
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
