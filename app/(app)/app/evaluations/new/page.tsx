import { z } from 'zod';
import { redirect } from 'next/navigation';
import { prisma } from '@/src/db/prisma';
import { requireUser } from '@/src/auth/session';
import styles from '../styles.module.css';
import { EvaluationBuilderForm } from './ui';

const createEvaluationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  packageId: z.string().cuid(),
  tests: z.array(z.string().cuid()).min(1, 'Select at least one test'),
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
  const parsed = createEvaluationSchema.safeParse({
    name: typeof name === 'string' ? name.trim() : '',
    packageId: typeof packageId === 'string' ? packageId : '',
    tests: tests.filter((value): value is string => typeof value === 'string'),
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
