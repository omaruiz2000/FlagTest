import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/src/db/prisma';
import { requirePlatformAdmin } from '@/src/auth/admin';
import styles from '../../../evaluations/styles.module.css';
import {
  addTestToPackage,
  getPackageWithItems,
  movePackageItem,
  removePackageItem,
  togglePackageItemFree,
} from '@/src/services/server/packages';

async function loadData(packageId: string) {
  const [testPackage, tests] = await Promise.all([
    getPackageWithItems(packageId),
    prisma.testDefinition.findMany({
      orderBy: { title: 'asc' },
      select: { id: true, title: true },
    }),
  ]);

  return { testPackage, tests };
}

async function addItem(formData: FormData) {
  'use server';

  await requirePlatformAdmin();
  const testPackageId = String(formData.get('testPackageId') || '');
  const testDefinitionId = String(formData.get('testDefinitionId') || '');
  if (!testPackageId || !testDefinitionId) return;
  await addTestToPackage(testPackageId, testDefinitionId);
  revalidatePath(`/app/admin/packages/${testPackageId}`);
}

async function deleteItem(formData: FormData) {
  'use server';

  await requirePlatformAdmin();
  const id = String(formData.get('id') || '');
  const testPackageId = String(formData.get('testPackageId') || '');
  if (!id || !testPackageId) return;
  await removePackageItem(id);
  revalidatePath(`/app/admin/packages/${testPackageId}`);
}

async function updateItemOrder(formData: FormData) {
  'use server';

  await requirePlatformAdmin();
  const id = String(formData.get('id') || '');
  const direction = String(formData.get('direction') || '') as 'up' | 'down';
  const testPackageId = String(formData.get('testPackageId') || '');
  if (!id || (direction !== 'up' && direction !== 'down') || !testPackageId) return;
  await movePackageItem(id, direction);
  revalidatePath(`/app/admin/packages/${testPackageId}`);
}

async function updateItemFree(formData: FormData) {
  'use server';

  await requirePlatformAdmin();
  const id = String(formData.get('id') || '');
  const testPackageId = String(formData.get('testPackageId') || '');
  const isFree = String(formData.get('isFree') || '') === 'true';
  if (!id || !testPackageId) return;
  await togglePackageItemFree(id, isFree);
  revalidatePath(`/app/admin/packages/${testPackageId}`);
}

export default async function PackageDetailsPage({ params }: { params: { packageId: string } }) {
  await requirePlatformAdmin();
  const { testPackage, tests } = await loadData(params.packageId);

  if (!testPackage) {
    return notFound();
  }

  const includedTestIds = new Set(testPackage.items.map((item) => item.testDefinitionId));
  const availableTests = tests.filter((test) => !includedTestIds.has(test.id));

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>{testPackage.title}</h1>
          <p className={styles.helper}>
            Slug: {testPackage.slug} · Active: {testPackage.isActive ? 'Yes' : 'No'}
          </p>
        </div>
        <Link className={styles.secondaryButton} href="/app/admin/packages">
          Back to packages
        </Link>
      </div>

      <div className={styles.card}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 style={{ margin: 0 }}>Tests</h2>
            <p className={styles.helper}>Add, reorder, or remove tests in this package.</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <form action={addItem} method="post" className={styles.inlineForm} style={{ alignItems: 'flex-end' }}>
            <input type="hidden" name="testPackageId" value={testPackage.id} />
            <label className={styles.field} style={{ minWidth: 240 }}>
              <span>Add test</span>
              <select name="testDefinitionId" defaultValue="">
                <option value="" disabled>
                  Select a test
                </option>
                {availableTests.map((test) => (
                  <option key={test.id} value={test.id}>
                    {test.title}
                  </option>
                ))}
              </select>
            </label>
            <button className={styles.submit} type="submit" disabled={!availableTests.length}>
              Add
            </button>
          </form>

          {testPackage.items.length ? (
            <table className={styles.inviteTable}>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Test</th>
                  <th>Free</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {testPackage.items.map((item, index) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <form action={updateItemOrder} method="post">
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="testPackageId" value={testPackage.id} />
                          <input type="hidden" name="direction" value="up" />
                          <button className={styles.secondaryButton} type="submit" disabled={index === 0}>
                            ↑
                          </button>
                        </form>
                        <form action={updateItemOrder} method="post">
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="testPackageId" value={testPackage.id} />
                          <input type="hidden" name="direction" value="down" />
                          <button
                            className={styles.secondaryButton}
                            type="submit"
                            disabled={index === testPackage.items.length - 1}
                          >
                            ↓
                          </button>
                        </form>
                      </div>
                    </td>
                    <td>
                      <div className={styles.testTitle}>{item.testDefinition.title}</div>
                      {item.testDefinition.description ? (
                        <p className={styles.helper}>{item.testDefinition.description}</p>
                      ) : null}
                    </td>
                    <td>
                      <form action={updateItemFree} method="post">
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="testPackageId" value={testPackage.id} />
                        <select name="isFree" defaultValue={item.isFree ? 'true' : 'false'}>
                          <option value="false">No</option>
                          <option value="true">Yes</option>
                        </select>
                        <button type="submit" className={styles.secondaryButton} style={{ marginLeft: 8 }}>
                          Save
                        </button>
                      </form>
                    </td>
                    <td>
                      <form action={deleteItem} method="post">
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="testPackageId" value={testPackage.id} />
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
      </div>
    </section>
  );
}
