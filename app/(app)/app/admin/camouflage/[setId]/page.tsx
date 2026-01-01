import { revalidatePath } from 'next/cache';
import { notFound } from 'next/navigation';
import { prisma } from '@/src/db/prisma';
import { requirePlatformAdmin } from '@/src/auth/admin';
import styles from '../../../evaluations/styles.module.css';

async function loadSet(setId: string) {
  return prisma.camouflageSet.findUnique({
    where: { id: setId },
    include: {
      characters: { orderBy: { sortOrder: 'asc' } },
    },
  });
}

async function addCharacter(formData: FormData) {
  'use server';

  await requirePlatformAdmin();

  const setId = String(formData.get('setId') || '');
  const key = String(formData.get('key') || '').trim();
  const title = String(formData.get('title') || '').trim();
  const imageUrl = String(formData.get('imageUrl') || '').trim();
  const sortOrder = Number(formData.get('sortOrder') || 0);

  if (!setId || !key || !title) return;

  await prisma.camouflageCharacter.upsert({
    where: { setId_key: { setId, key } },
    update: { title, imageUrl, sortOrder },
    create: { setId, key, title, imageUrl, sortOrder },
  });

  revalidatePath(`/app/admin/camouflage/${setId}`);
}

async function updateCharacter(formData: FormData) {
  'use server';

  await requirePlatformAdmin();

  const id = String(formData.get('id') || '');
  const setId = String(formData.get('setId') || '');
  const title = String(formData.get('title') || '').trim();
  const imageUrl = String(formData.get('imageUrl') || '').trim();
  const sortOrder = Number(formData.get('sortOrder') || 0);

  if (!id || !setId || !title) return;

  await prisma.camouflageCharacter.update({
    where: { id },
    data: { title, imageUrl, sortOrder },
  });

  revalidatePath(`/app/admin/camouflage/${setId}`);
}

async function deleteCharacter(formData: FormData) {
  'use server';

  await requirePlatformAdmin();

  const id = String(formData.get('id') || '');
  const setId = String(formData.get('setId') || '');
  if (!id || !setId) return;

  await prisma.camouflageCharacter.delete({ where: { id } });
  revalidatePath(`/app/admin/camouflage/${setId}`);
}

export default async function CamouflageSetDetail({ params }: { params: { setId: string } }) {
  await requirePlatformAdmin();

  const set = await loadSet(params.setId);
  if (!set) {
    notFound();
  }

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <h1>{set.title}</h1>
        <p className={styles.helper}>Administra los personajes de este set.</p>
      </div>

      <div className={styles.card}>
        <h3>Agregar personaje</h3>
        <form action={addCharacter} className={styles.inlineForm}>
          <input type="hidden" name="setId" value={set.id} />
          <label className={styles.field}>
            <span>Key</span>
            <input name="key" required placeholder="explorador" />
          </label>
          <label className={styles.field}>
            <span>Title</span>
            <input name="title" required placeholder="El Explorador" />
          </label>
          <label className={styles.field}>
            <span>Image URL</span>
            <input name="imageUrl" placeholder="https://example.com/image.png" />
          </label>
          <label className={styles.field}>
            <span>Sort order</span>
            <input name="sortOrder" type="number" defaultValue={set.characters.length} />
          </label>
          <button type="submit" className={styles.submit}>
            Añadir
          </button>
        </form>
      </div>

      <div className={styles.card}>
        <h3>Personajes</h3>
        {set.characters.length ? (
          <table className={styles.inviteTable}>
            <thead>
              <tr>
                <th>Key</th>
                <th>Title</th>
                <th>Image</th>
                <th>Sort</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {set.characters.map((character) => (
                <tr key={character.id}>
                  <form id={`character-${character.id}`} action={updateCharacter}>
                    <input type="hidden" name="id" value={character.id} />
                    <input type="hidden" name="setId" value={set.id} />
                  </form>
                  <td>{character.key}</td>
                  <td>
                    <input
                      form={`character-${character.id}`}
                      name="title"
                      defaultValue={character.title}
                      className={styles.tableInput}
                    />
                  </td>
                  <td>
                    <input
                      form={`character-${character.id}`}
                      name="imageUrl"
                      defaultValue={character.imageUrl ?? ''}
                      className={styles.tableInput}
                    />
                  </td>
                  <td>
                    <input
                      form={`character-${character.id}`}
                      name="sortOrder"
                      type="number"
                      defaultValue={character.sortOrder}
                    />
                  </td>
                  <td>
                    <div className={styles.inlineForm}>
                      <button form={`character-${character.id}`} type="submit" className={styles.secondaryButton}>
                        Guardar
                      </button>
                      <form action={deleteCharacter}>
                        <input type="hidden" name="id" value={character.id} />
                        <input type="hidden" name="setId" value={set.id} />
                        <button type="submit" className={styles.secondaryButton}>
                          Eliminar
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className={styles.helper}>No characters yet.</p>
        )}
      </div>
    </section>
  );
}
