import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/src/db/prisma';
import { requirePlatformAdmin } from '@/src/auth/admin';
import styles from '../../evaluations/styles.module.css';

async function loadSets() {
  return prisma.camouflageSet.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { characters: true, options: true, evaluationTests: true } } },
  });
}

async function createSet(formData: FormData) {
  'use server';

  await requirePlatformAdmin();

  const slug = String(formData.get('slug') || '').trim();
  const title = String(formData.get('title') || '').trim();
  if (!slug || !title) return;

  await prisma.camouflageSet.create({ data: { slug, title } });
  revalidatePath('/app/admin/camouflage');
}

async function toggleSet(formData: FormData) {
  'use server';

  await requirePlatformAdmin();

  const id = String(formData.get('id') || '');
  const isActive = formData.get('isActive') === 'true';

  if (!id) return;
  await prisma.camouflageSet.update({ where: { id }, data: { isActive } });
  revalidatePath('/app/admin/camouflage');
}

export default async function CamouflageAdminPage() {
  await requirePlatformAdmin();

  const sets = await loadSets();

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <h1>Camouflage sets</h1>
        <p>Manage sets available for camouflage mode.</p>
      </div>

      <div className={styles.card}>
        <h3>Create set</h3>
        <form action={createSet} className={styles.inlineForm}>
          <label className={styles.field}>
            <span>Slug</span>
            <input name="slug" required placeholder="exploradores" />
          </label>
          <label className={styles.field}>
            <span>Title</span>
            <input name="title" required placeholder="Exploradores" />
          </label>
          <button type="submit" className={styles.submit}>
            Crear
          </button>
        </form>
      </div>

      <div className={styles.card}>
        <h3>Sets</h3>
        {sets.length ? (
          <table className={styles.inviteTable}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Slug</th>
                <th>Active</th>
                <th>Characters</th>
                <th>Tests</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sets.map((set) => (
                <tr key={set.id}>
                  <td>
                    <Link href={`/app/admin/camouflage/${set.id}`}>{set.title}</Link>
                  </td>
                  <td>{set.slug}</td>
                  <td>
                    <form action={toggleSet} className={styles.inlineForm}>
                      <input type="hidden" name="id" value={set.id} />
                      <input type="hidden" name="isActive" value={set.isActive ? 'false' : 'true'} />
                      <span className={styles.pill}>{set.isActive ? 'Active' : 'Inactive'}</span>
                      <button type="submit" className={styles.secondaryButton}>
                        {set.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </form>
                  </td>
                  <td>{set._count.characters}</td>
                  <td>{set._count.options}</td>
                  <td>{set._count.evaluationTests}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className={styles.helper}>No sets yet.</p>
        )}
      </div>
    </section>
  );
}
