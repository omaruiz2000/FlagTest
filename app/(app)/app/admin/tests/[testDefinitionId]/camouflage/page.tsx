import { revalidatePath } from 'next/cache';
import { notFound } from 'next/navigation';
import { prisma } from '@/src/db/prisma';
import { requirePlatformAdmin } from '@/src/auth/admin';
import styles from '../../../../evaluations/styles.module.css';

const MIN_SLOTS = 2;
const MAX_SLOTS = 5;

async function loadData(testDefinitionId: string) {
  const test = await prisma.testDefinition.findUnique({
    where: { id: testDefinitionId },
    include: {
      camouflageSlots: { orderBy: { rank: 'asc' } },
      camouflageOptions: {
        orderBy: { sortOrder: 'asc' },
        include: {
          camouflageSet: { include: { characters: { orderBy: { sortOrder: 'asc' } } } },
        },
      },
    },
  });

  const allowedSetIds = test?.camouflageOptions.map((option) => option.camouflageSetId) ?? [];

  const [sets, mappings, copies] = await Promise.all([
    prisma.camouflageSet.findMany({ orderBy: { title: 'asc' }, where: { isActive: true } }),
    prisma.testCamouflageMapping.findMany({
      where: { testDefinitionId, camouflageSetId: { in: allowedSetIds } },
      include: { character: true },
    }),
    prisma.testCamouflageCopy.findMany({ where: { testDefinitionId, camouflageSetId: { in: allowedSetIds } } }),
  ]);

  return { test, sets, mappings, copies };
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

async function addSlot(formData: FormData) {
  'use server';

  await requirePlatformAdmin();

  const testDefinitionId = String(formData.get('testDefinitionId') || '');
  const key = String(formData.get('key') || '').trim();
  const rank = Number(formData.get('rank') || 0);
  const title = String(formData.get('title') || '').trim() || undefined;

  if (!testDefinitionId || !key) return;

  const count = await prisma.testCamouflageSlot.count({ where: { testDefinitionId } });
  if (count >= MAX_SLOTS) return;

  await prisma.testCamouflageSlot.create({ data: { testDefinitionId, key, rank, title } });
  revalidatePath(`/app/admin/tests/${testDefinitionId}/camouflage`);
}

async function updateSlot(formData: FormData) {
  'use server';

  await requirePlatformAdmin();

  const id = String(formData.get('id') || '');
  const testDefinitionId = String(formData.get('testDefinitionId') || '');
  const rank = Number(formData.get('rank') || 0);
  const title = String(formData.get('title') || '').trim() || undefined;

  if (!id || !testDefinitionId) return;

  await prisma.testCamouflageSlot.update({ where: { id }, data: { rank, title } });
  revalidatePath(`/app/admin/tests/${testDefinitionId}/camouflage`);
}

async function deleteSlot(formData: FormData) {
  'use server';

  await requirePlatformAdmin();

  const id = String(formData.get('id') || '');
  const testDefinitionId = String(formData.get('testDefinitionId') || '');
  const slotKey = String(formData.get('slotKey') || '');

  if (!id || !testDefinitionId || !slotKey) return;

  const count = await prisma.testCamouflageSlot.count({ where: { testDefinitionId } });
  if (count <= MIN_SLOTS) return;

  await prisma.testCamouflageMapping.deleteMany({ where: { testDefinitionId, slotKey } });
  await prisma.testCamouflageCopy.deleteMany({ where: { testDefinitionId, slotKey } });
  await prisma.testCamouflageSlot.delete({ where: { id } });

  revalidatePath(`/app/admin/tests/${testDefinitionId}/camouflage`);
}

async function updateCamouflageSetConfiguration(formData: FormData) {
  'use server';

  await requirePlatformAdmin();

  const testDefinitionId = String(formData.get('testDefinitionId') || '');
  const camouflageSetId = String(formData.get('camouflageSetId') || '');

  if (!testDefinitionId || !camouflageSetId) return;

  const allowed = await prisma.testCamouflageOption.findUnique({
    where: { testDefinitionId_camouflageSetId: { testDefinitionId, camouflageSetId } },
  });
  if (!allowed) return;

  const [slots, characters] = await Promise.all([
    prisma.testCamouflageSlot.findMany({ where: { testDefinitionId }, orderBy: { rank: 'asc' } }),
    prisma.camouflageCharacter.findMany({ where: { setId: camouflageSetId } }),
  ]);

  for (const slot of slots) {
    const characterId = String(formData.get(`characterId_${slot.key}`) || '');
    const headline = String(formData.get(`headline_${slot.key}`) || '').trim();
    const description = String(formData.get(`description_${slot.key}`) || '').trim();
    const tipsValue = String(formData.get(`tips_${slot.key}`) || '').trim();

    const character = characters.find((char) => char.id === characterId);
    if (characterId && character) {
      await prisma.testCamouflageMapping.upsert({
        where: {
          testDefinitionId_camouflageSetId_slotKey: { testDefinitionId, camouflageSetId, slotKey: slot.key },
        },
        update: { characterId },
        create: { testDefinitionId, camouflageSetId, slotKey: slot.key, characterId },
      });
    }

    if (headline && description) {
      await prisma.testCamouflageCopy.upsert({
        where: {
          testDefinitionId_camouflageSetId_slotKey: { testDefinitionId, camouflageSetId, slotKey: slot.key },
        },
        update: {
          headline,
          description,
          tips: tipsValue ? tipsValue.split(/\r?\n/).filter(Boolean) : undefined,
        },
        create: {
          testDefinitionId,
          camouflageSetId,
          slotKey: slot.key,
          headline,
          description,
          tips: tipsValue ? tipsValue.split(/\r?\n/).filter(Boolean) : undefined,
        },
      });
    }
  }

  revalidatePath(`/app/admin/tests/${testDefinitionId}/camouflage`);
}

export default async function TestCamouflagePage({ params }: { params: { testDefinitionId: string } }) {
  await requirePlatformAdmin();

  const { test, sets, mappings, copies } = await loadData(params.testDefinitionId);
  if (!test) {
    notFound();
  }

  const availableSets = sets.filter(
    (set) => !test.camouflageOptions.some((option) => option.camouflageSetId === set.id),
  );

  const mappingLookup = new Map(
    mappings.map((mapping) => [`${mapping.camouflageSetId}-${mapping.slotKey}`, mapping]),
  );
  const copyLookup = new Map(
    copies.map((copy) => [`${copy.camouflageSetId}-${copy.slotKey}`, copy]),
  );

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <h1>{test.title}</h1>
        <p className={styles.helper}>Camouflage options for this test.</p>
      </div>

      <div className={styles.card}>
        <h3>Slots</h3>
        <p className={styles.helper}>Define the ordered buckets that map scores to characters.</p>
        <table className={styles.inviteTable}>
          <thead>
            <tr>
              <th>Key</th>
              <th>Title</th>
              <th>Rank</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {test.camouflageSlots.map((slot) => (
              <tr key={slot.id}>
                <td>{slot.key}</td>
                <td>
                  <input
                    form={`slot-${slot.id}-form`}
                    name="title"
                    className={styles.tableInput}
                    defaultValue={slot.title || ''}
                  />
                </td>
                <td>
                  <form id={`slot-${slot.id}-form`} action={updateSlot} className={styles.inlineForm}>
                    <input type="hidden" name="id" value={slot.id} />
                    <input type="hidden" name="testDefinitionId" value={test.id} />
                    <input
                      name="rank"
                      type="number"
                      className={styles.tableInput}
                      defaultValue={slot.rank}
                      min={1}
                    />
                    <button type="submit" className={styles.secondaryButton}>
                      Save
                    </button>
                  </form>
                </td>
                <td>
                  <form action={deleteSlot}>
                    <input type="hidden" name="id" value={slot.id} />
                    <input type="hidden" name="testDefinitionId" value={test.id} />
                    <input type="hidden" name="slotKey" value={slot.key} />
                    <button type="submit" className={styles.secondaryButton} disabled={test.camouflageSlots.length <= MIN_SLOTS}>
                      Remove
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <form action={addSlot} className={styles.inlineForm}>
          <input type="hidden" name="testDefinitionId" value={test.id} />
          <label className={styles.field}>
            <span>Key</span>
            <input name="key" required placeholder="LOW" />
          </label>
          <label className={styles.field}>
            <span>Title</span>
            <input name="title" placeholder="Optional label" />
          </label>
          <label className={styles.field}>
            <span>Rank</span>
            <input name="rank" type="number" defaultValue={test.camouflageSlots.length + 1} min={1} />
          </label>
          <button type="submit" className={styles.submit} disabled={test.camouflageSlots.length >= MAX_SLOTS}>
            Add slot
          </button>
        </form>
        <p className={styles.helper}>Minimum {MIN_SLOTS} slots, maximum {MAX_SLOTS}.</p>
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

      {test.camouflageOptions.map((option) => {
        const set = option.camouflageSet;
        const ready = test.camouflageSlots.every(
          (slot) => mappingLookup.get(`${set.id}-${slot.key}`) && copyLookup.get(`${set.id}-${slot.key}`),
        );

        return (
          <div className={styles.card} key={option.id}>
            <div className={styles.sectionHeader}>
              <div>
                <h3>{set.title}</h3>
                <p className={styles.helper}>Configure character and copy per slot.</p>
              </div>
              <span className={styles.helper}>{ready ? 'Ready' : 'Missing entries'}</span>
            </div>
            <form action={updateCamouflageSetConfiguration}>
              <input type="hidden" name="testDefinitionId" value={test.id} />
              <input type="hidden" name="camouflageSetId" value={set.id} />
              <table className={styles.inviteTable}>
                <thead>
                  <tr>
                    <th>Slot</th>
                    <th>Character</th>
                    <th>Headline</th>
                    <th>Description</th>
                    <th>Tips (one per line)</th>
                  </tr>
                </thead>
                <tbody>
                  {test.camouflageSlots.map((slot) => {
                    const selectedMapping = mappingLookup.get(`${set.id}-${slot.key}`);
                    const selectedCopy = copyLookup.get(`${set.id}-${slot.key}`);
                    return (
                      <tr key={`${set.id}-${slot.id}`}>
                        <td>
                          <div className={styles.field}>
                            <span>{slot.title || slot.key}</span>
                            <span className={styles.helper}>Rank {slot.rank}</span>
                          </div>
                        </td>
                        <td>
                          <select
                            name={`characterId_${slot.key}`}
                            defaultValue={selectedMapping?.characterId || ''}
                            className={styles.tableInput}
                          >
                            <option value="">Select</option>
                            {set.characters.map((character) => (
                              <option key={character.id} value={character.id}>
                                {character.title}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            name={`headline_${slot.key}`}
                            className={styles.tableInput}
                            defaultValue={selectedCopy?.headline || ''}
                          />
                        </td>
                        <td>
                          <textarea
                            name={`description_${slot.key}`}
                            className={styles.tableInput}
                            defaultValue={selectedCopy?.description || ''}
                          />
                        </td>
                        <td>
                          <textarea
                            name={`tips_${slot.key}`}
                            className={styles.tableInput}
                            placeholder="One tip per line"
                            defaultValue={Array.isArray(selectedCopy?.tips) ? selectedCopy?.tips.join('\n') : ''}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <button type="submit" className={styles.submit}>
                  Save {set.title}
                </button>
              </div>
            </form>
          </div>
        );
      })}
    </section>
  );
}
