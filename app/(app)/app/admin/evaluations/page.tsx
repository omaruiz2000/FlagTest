import Link from 'next/link';
import { prisma } from '@/src/db/prisma';
import { requirePlatformAdmin } from '@/src/auth/admin';
import styles from '../../evaluations/styles.module.css';
import { EvaluationActions } from './EvaluationActions';

export const dynamic = 'force-dynamic';

async function loadEvaluations(search: string, showDeleted: boolean) {
  return prisma.evaluation.findMany({
    where: {
      ...(showDeleted ? {} : { deletedAt: null }),
      ...(search
        ? {
            name: { contains: search, mode: 'insensitive' },
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      ownerUser: { select: { email: true } },
      organization: { select: { name: true } },
    },
  });
}

export default async function AdminEvaluationsPage({
  searchParams,
}: {
  searchParams: { search?: string; showDeleted?: string };
}) {
  await requirePlatformAdmin();
  const search = (searchParams.search || '').trim();
  const showDeleted = searchParams.showDeleted === 'true';
  const evaluations = await loadEvaluations(search, showDeleted);

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Evaluations</h1>
          <p className={styles.helper}>Platform-level view with delete controls.</p>
        </div>
        <Link className={styles.secondaryButton} href="/app/admin">
          Back to admin
        </Link>
      </div>

      <div className={styles.card}>
        <form className={styles.inlineForm}>
          <label className={styles.field}>
            <span>Search</span>
            <input type="text" name="search" defaultValue={search} placeholder="Name" />
          </label>
          <label className={styles.field}>
            <span>Show deleted</span>
            <select name="showDeleted" defaultValue={showDeleted ? 'true' : 'false'}>
              <option value="false">Hide</option>
              <option value="true">Show</option>
            </select>
          </label>
          <button type="submit" className={styles.submit}>
            Apply
          </button>
        </form>
      </div>

      <div className={styles.card}>
        {evaluations.length ? (
          <table className={styles.inviteTable}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Owner</th>
                <th>Organization</th>
                <th>Status</th>
                <th>Created</th>
                <th>Deleted</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {evaluations.map((evaluation) => (
                <tr key={evaluation.id}>
                  <td>
                    <div className={styles.testTitle}>{evaluation.name}</div>
                    <p className={styles.helper}>{evaluation.id}</p>
                  </td>
                  <td>{evaluation.ownerUser?.email || '—'}</td>
                  <td>{evaluation.organization?.name || '—'}</td>
                  <td>{evaluation.status}</td>
                  <td>{evaluation.createdAt.toLocaleString()}</td>
                  <td>{evaluation.deletedAt ? evaluation.deletedAt.toLocaleString() : '—'}</td>
                  <td>
                    <EvaluationActions evaluationId={evaluation.id} isDeleted={!!evaluation.deletedAt} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className={styles.helper}>No evaluations match the current filters.</p>
        )}
      </div>
    </section>
  );
}
