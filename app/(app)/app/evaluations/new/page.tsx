import { z } from 'zod';
import { redirect } from 'next/navigation';
import { prisma } from '@/src/db/prisma';
import { listCorePackagesWithItems } from '@/src/db/repositories/testPackages';
import { requireUser } from '@/src/auth/session';
import { generateInviteToken, hashInviteToken } from '@/src/auth/inviteTokens';
import styles from '../styles.module.css';
import { EvaluationBuilderForm } from './ui';

const rosterEntrySchema = z.object({
  student_code: z.string().min(1),
  grade: z.string().optional(),
  section: z.string().optional(),
  classroom: z.string().optional(),
});

const createEvaluationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  packageId: z.string().cuid(),
  tests: z.array(z.string().cuid()).min(1, 'Select at least one test'),
  inviteCount: z.number().int().min(1).max(500).default(1).optional(),
  inviteLabels: z.array(z.string()).optional(),
  participantFeedbackMode: z.enum(['THANK_YOU_ONLY', 'CAMOUFLAGE']).default('THANK_YOU_ONLY'),
  roster: z.array(rosterEntrySchema).default([]),
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
  return listCorePackagesWithItems();
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
  const rosterPayload = (() => {
    const raw = formData.get('roster');
    if (typeof raw !== 'string' || !raw.trim()) return [] as Array<z.infer<typeof rosterEntrySchema>>;
    try {
      return JSON.parse(raw) as Array<z.infer<typeof rosterEntrySchema>>;
    } catch (error) {
      return [] as Array<z.infer<typeof rosterEntrySchema>>;
    }
  })();

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
    roster: rosterPayload,
  });

  if (!parsed.success) {
    const error = parsed.error.issues.at(0)?.message ?? 'Invalid input';
    return { error };
  }

  const { name: evalName, packageId: evalPackageId, tests: selectedTests } = parsed.data;
  const { participantFeedbackMode: feedbackMode } = parsed.data;
  const rosterEntries = parsed.data.roster.map((entry) => ({
    student_code: entry.student_code.trim(),
    grade: entry.grade?.trim() || undefined,
    section: entry.section?.trim() || entry.classroom?.trim() || undefined,
  }));

  const seenCodes = new Set<string>();
  for (const entry of rosterEntries) {
    if (seenCodes.has(entry.student_code)) {
      return { error: 'Duplicate student_code found in roster' };
    }
    seenCodes.add(entry.student_code);
  }

  const pkg = await prisma.testPackage.findUnique({ where: { id: evalPackageId }, select: { slug: true } });

  if (!pkg) {
    return { error: 'Selected package not found' };
  }
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

  if (pkg.slug === 'school') {
    if (!rosterEntries.length) {
      return { error: 'Roster is required for school package' };
    }

    await prisma.evaluationRosterEntry.createMany({
      data: rosterEntries.map((entry) => ({
        evaluationId: evaluation.id,
        studentCode: entry.student_code,
        grade: entry.grade,
        section: entry.section,
      })),
      skipDuplicates: true,
    });
  } else {
    const invites = [] as { evaluationId: string; token: string; tokenHash: string; alias?: string | null }[];
    const labels = parsed.data.inviteLabels ?? [];
    const inviteTotal = parsed.data.inviteCount ?? 0;
    if (!inviteTotal || inviteTotal < 1) {
      return { error: 'At least one invite is required' };
    }

    for (let i = 0; i < inviteTotal; i += 1) {
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
