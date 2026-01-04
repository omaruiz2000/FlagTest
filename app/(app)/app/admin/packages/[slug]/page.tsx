import Link from 'next/link';
import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/src/db/prisma';
import { requireUser } from '@/src/auth/session';
import { isPlatformAdmin } from '@/src/auth/admin';
import {
  CORE_PACKAGE_SLUGS,
  findCorePackageBySlug,
  findCorePackageWithItems,
} from '@/src/db/repositories/testPackages';
import styles from '../../../evaluations/styles.module.css';

type PackageParams = {
  params: { slug: string };
};

const addTestSchema = z.object({
  slug: z.enum(CORE_PACKAGE_SLUGS),
  testDefinitionId: z.string().cuid(),
});

const itemActionSchema = z.object({
  slug: z.enum(CORE_PACKAGE_SLUGS),
  itemId: z.string().cuid(),
});

const moveSchema = itemActionSchema.extend({
  direction: z.enum(['up', 'down']),
});

async function assertAdmin() {
  const user = await requireUser();
  if (!isPlatformAdmin(user)) {
    return null;
  }
  return user;
}

async function addTestToPackage(formData: FormData) {
  'use server';

  const admin = await assertAdmin();
  if (!admin) {
    return { error: 'Not authorized' };
  }

  const parsed = addTestSchema.safeParse({
    slug: formData.get('slug'),
    testDefinitionId: formData.get('testDefinitionId'),
  });

  if (!parsed.success) {
    return { error: 'Invalid input' };
  }

  const { slug, testDefinitionId } = parsed.data;
  const pkg = await findCorePackageBySlug(slug);

  if (!pkg) {
    return { error: 'Package not found' };
  }

  const existing = await prisma.testPackageItem.findUnique({
    where: { testPackageId_testDefinitionId: { testPackageId: pkg.id, testDefinitionId } },
  });

  if (!existing) {
    const nextOrder = await prisma.testPackageItem.count({ where: { testPackageId: pkg.id } });
    await prisma.testPackageItem.create({
      data: {
        testPackageId: pkg.id,
        testDefinitionId,
        sortOrder: nextOrder,
      },
    });
  }

  revalidatePath('/app/admin/packages');
  revalidatePath(`/app/admin/packages/${slug}`);
  return { success: true };
}

async function removeTestFromPackage(formData: FormData) {
  'use server';

  const admin = await assertAdmin();
  if (!admin) {
    return { error: 'Not authorized' };
  }

  const parsed = itemActionSchema.safeParse({
    slug: formData.get('slug'),
    itemId: formData.get('itemId'),
  });

  if (!parsed.success) {
    return { error: 'Invalid input' };
  }

  const item = await prisma.testPackageItem.findUnique({
    where: { id: parsed.data.itemId },
    include: { testPackage: true },
  });

  if (!item || item.testPackage.slug !== parsed.data.slug) {
    return { error: 'Item not found' };
  }

  await prisma.testPackageItem.delete({ where: { id: item.id } });
  revalidatePath('/app/admin/packages');
  revalidatePath(`/app/admin/packages/${parsed.data.slug}`);
  return { success: true };
}

async function movePackageItem(formData: FormData) {
  'use server';

  const admin = await assertAdmin();
  if (!admin) {
    return { error: 'Not authorized' };
  }

  const parsed = moveSchema.safeParse({
    slug: formData.get('slug'),
    itemId: formData.get('itemId'),
    direction: formData.get('direction'),
  });

  if (!parsed.success) {
    return { error: 'Invalid input' };
  }

  const item = await prisma.testPackageItem.findUnique({
    where: { id: parsed.data.itemId },
    include: { testPackage: true },
  });

  if (!item || item.testPackage.slug !== parsed.data.slug) {
    return { error: 'Item not found' };
  }

  const siblings = await prisma.testPackageItem.findMany({
    where: { testPackageId: item.testPackageId },
    orderBy: { sortOrder: 'asc' },
  });
  const currentIndex = siblings.findIndex((entry) => entry.id === item.id);
  const targetIndex = parsed.data.direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  const target = siblings[targetIndex];

  if (!target) {
    return { error: 'Cannot move item' };
  }

  await prisma.$transaction([
    prisma.testPackageItem.update({ where: { id: item.id }, data: { sortOrder: target.sortOrder } }),
    prisma.testPackageItem.update({ where: { id: target.id }, data: { sortOrder: item.sortOrder } }),
  ]);

  revalidatePath('/app/admin/packages');
  revalidatePath(`/app/admin/packages/${parsed.data.slug}`);
  return { success: true };
}

async function toggleFreeFlag(formData: FormData) {
  'use server';

  const admin = await assertAdmin();
  if (!admin) {
    return { error: 'Not authorized' };
  }

  const parsed = itemActionSchema.extend({ isFree: z.enum(['true', 'false']) }).safeParse({
    slug: formData.get('slug'),
    itemId: formData.get('itemId'),
    isFree: formData.get('isFree'),
  });

  if (!parsed.success) {
    return { error: 'Invalid input' };
  }

  const item = await prisma.testPackageItem.findUnique({
    where: { id: parsed.data.itemId },
    include: { testPackage: true },
  });

  if (!item || item.testPackage.slug !== parsed.data.slug) {
    return { error: 'Item not found' };
  }

  await prisma.testPackageItem.update({
    where: { id: item.id },
    data: { isFree: parsed.data.isFree === 'true' },
  });

  revalidatePath('/app/admin/packages');
  revalidatePath(`/app/admin/packages/${parsed.data.slug}`);
  return { success: true };
}

export const dynamic = 'force-dynamic';

export default async function AdminPackageDetailPage({ params }: PackageParams) {
  const user = await requireUser();
  const isAdmin = isPlatformAdmin(user);

  if (!isAdmin) {
    return <p>Not authorized</p>;
  }

  const pkg = await findCorePackageWithItems(params.slug);

  if (!pkg) {
    notFound();
  }

  const tests = await prisma.testDefinition.findMany({ orderBy: { title: 'asc' } });
  const assignedTestIds = new Set(pkg.items.map((item) => item.testDefinitionId));
  const addableTests = tests.filter((test) => !assignedTestIds.has(test.id));

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className={styles.helper}>{pkg.slug}</div>
          <h1>{pkg.title}</h1>
          <p className={styles.helper}>Add, remove, reorder, or toggle free tests in this package.</p>
        </div>
        <Link className={styles.secondaryButton} href="/app/admin/packages">
          Back to packages
        </Link>
      </div>

      <div className={styles.card}>
        {pkg.items.length ? (
          <table className={styles.inviteTable}>
            <thead>
              <tr>
                <th>Test</th>
                <th>Sort</th>
                <th>Free</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pkg.items.map((item, index) => (
                <tr key={item.id}>
                  <td>
                    <div className={styles.testTitle}>{item.testDefinition.title}</div>
                    <p className={styles.helper}>{item.testDefinition.description}</p>
                  </td>
                  <td className={styles.actionsCell}>
                    <form action={movePackageItem} className={styles.inlineForm}>
                      <input type="hidden" name="slug" value={pkg.slug} />
                      <input type="hidden" name="itemId" value={item.id} />
                      <input type="hidden" name="direction" value="up" />
                      <button type="submit" className={styles.secondaryButton} disabled={index === 0}>
                        Up
                      </button>
                    </form>
                    <form action={movePackageItem} className={styles.inlineForm}>
                      <input type="hidden" name="slug" value={pkg.slug} />
                      <input type="hidden" name="itemId" value={item.id} />
                      <input type="hidden" name="direction" value="down" />
                      <button
                        type="submit"
                        className={styles.secondaryButton}
                        disabled={index === pkg.items.length - 1}
                      >
                        Down
                      </button>
                    </form>
                  </td>
                  <td>
                    <form action={toggleFreeFlag}>
                      <input type="hidden" name="slug" value={pkg.slug} />
                      <input type="hidden" name="itemId" value={item.id} />
                      <input type="hidden" name="isFree" value={item.isFree ? 'false' : 'true'} />
                      <button type="submit" className={styles.secondaryButton}>
                        {item.isFree ? 'Mark paid' : 'Mark free'}
                      </button>
                    </form>
                  </td>
                  <td>
                    <form action={removeTestFromPackage}>
                      <input type="hidden" name="slug" value={pkg.slug} />
                      <input type="hidden" name="itemId" value={item.id} />
                      <button type="submit" className={styles.secondaryButton}>
                        Remove
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className={styles.helper}>No tests in this package yet.</p>
        )}
      </div>

      <div className={styles.card}>
        <h3>Add test to package</h3>
        <form action={addTestToPackage} className={styles.inlineForm}>
          <input type="hidden" name="slug" value={pkg.slug} />
          <label className={styles.field}>
            <span>Test definition</span>
            <select name="testDefinitionId" defaultValue="">
              <option value="" disabled>
                Select test
              </option>
              {addableTests.map((test) => (
                <option key={test.id} value={test.id}>
                  {test.title}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className={styles.submit} disabled={!addableTests.length}>
            Add
          </button>
        </form>
        {!addableTests.length && <p className={styles.helper}>All tests are already in this package.</p>}
      </div>
    </section>
  );
}
