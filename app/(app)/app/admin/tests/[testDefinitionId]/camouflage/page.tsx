import { revalidatePath } from 'next/cache';
import { notFound } from 'next/navigation';
import { prisma } from '@/src/db/prisma';
import { requirePlatformAdmin } from '@/src/auth/admin';
import styles from '../../../../evaluations/styles.module.css';

async function loadData(testDefinitionId: string) {
  const [test, sets] = await Promise.all([
    prisma.testDefinition.findUnique({
      where: { id: testDefinitionId },
      include: {
        camouflageOptions: {
          orderBy: { sortOrder: 'asc' },
          include: { camouflageSet: true },
        },
      },
    }),
    prisma.camouflageSet.findMany({ orderBy: { title: 'asc' }, where: { isActive: true } }),
  ]);
  return { test, sets };
}

async function addOption(formData: FormData) {
  'use server';

  await requirePlatformAdmin();

  const testDefinitionId = String(formData.get('testDefinitionId') || '');
  const camouflageSetId = String(formData.get('camouflageSetId') || '');
  const sortOrder = Number(formData.get('sortOrder') || 0);

  if (!testDefinitionId || !camouflageSetId) return;

  await prisma.testCamouflageOption.upsert({
    where: { testDefinitionId_camouflageSetId: { testDefinitionId, camouflageSetId } },
    update: { isActive: true, sortOrder },
    create: { testDefinitionId, camouflageSetId, sortOrder },
  });

  revalidatePath(`/app/admin/tests/${testDefinitionId}/camouflage`);
}

async function updateOption(formData: FormData) {
  'use server';

  await requirePlatformAdmin();

  const id = String(formData.get('id') || '');
  const testDefinitionId = String(formData.get('testDefinitionId') || '');
  const sortOrder = Number(formData.get('sortOrder') || 0);
  const isActive = formData.get('isActive') === 'true';
  if (!id || !testDefinitionId) return;

  await prisma.testCamouflageOption.update({ where: { id }, data: { sortOrder, isActive } });
  revalidatePath(`/app/admin/tests/${testDefinitionId}/camouflage`);
}

async function deleteOption(formData: FormData) {
  'use server';

  await requirePlatformAdmin();

  const id = String(formData.get('id') || '');
  const testDefinitionId = String(formData.get('testDefinitionId') || '');
  if (!id || !testDefinitionId) return;

  await prisma.testCamouflageOption.delete({ where: { id } });
  revalidatePath(`/app/admin/tests/${testDefinitionId}/camouflage`);
}

export default async function TestCamouflagePage({ params }: { params: { testDefinitionId: string } }) {
  await requirePlatformAdmin();

  const { test, sets } = await loadData(params.testDefinitionId);
  if (!test) {
    notFound();
  }

  const availableSets = sets.filter(
    (set) => !test.camouflageOptions.some((option) => option.camouflageSetId === set.id),
  );

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <h1>{test.title}</h1>
        <p className={styles.helper}>Camouflage options for this test.</p>
      </div>

      <div className={styles.card}>
        <h3>Allowed sets</h3>
        {test.camouflageOptions.length ? (
          <table className={styles.inviteTable}>
            <thead>
              <tr>
                <th>Set</th>
                <th>Sort order</th>
                <th>Active</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {test.camouflageOptions.map((option) => (
                <tr key={option.id}>
                  <td>{option.camouflageSet.title}</td>
                  <td>
                    <form action={updateOption} className={styles.inlineForm}>
                      <input type="hidden" name="id" value={option.id} />
                      <input type="hidden" name="testDefinitionId" value={test.id} />
                      <input name="sortOrder" type="number" defaultValue={option.sortOrder} />
                      <select name="isActive" defaultValue={option.isActive ? 'true' : 'false'}>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                      <button type="submit" className={styles.secondaryButton}>
                        Save
                      </button>
                    </form>
                  </td>
                  <td>{option.isActive ? 'Yes' : 'No'}</td>
                  <td>
                    <form action={deleteOption}>
                      <input type="hidden" name="id" value={option.id} />
                      <input type="hidden" name="testDefinitionId" value={test.id} />
                      <button type="submit" className={styles.secondaryButton}>Remove</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className={styles.helper}>No camouflage sets assigned yet.</p>
        )}
      </div>

      <div className={styles.card}>
        <h3>Add allowed set</h3>
        <form action={addOption} className={styles.inlineForm}>
          <input type="hidden" name="testDefinitionId" value={test.id} />
          <label className={styles.field}>
            <span>Camouflage set</span>
            <select name="camouflageSetId" required defaultValue="">
              <option value="" disabled>
                Select a set
              </option>
              {availableSets.map((set) => (
                <option key={set.id} value={set.id}>
                  {set.title}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>Sort order</span>
            <input name="sortOrder" type="number" defaultValue={test.camouflageOptions.length} />
          </label>
          <button type="submit" className={styles.submit} disabled={!availableSets.length}>
            Add set
          </button>
        </form>
      </div>
    </section>
  );
}
