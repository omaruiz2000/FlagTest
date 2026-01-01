import Link from 'next/link';
import { requireUser } from '@/src/auth/session';
import { prisma } from '@/src/db/prisma';
import styles from './styles.module.css';

async function loadEvaluations(ownerId: string) {
  return prisma.evaluation.findMany({
    where: { ownerUserId: ownerId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, description: true },
  });
}

export default async function EvaluationsIndexPage() {
  const user = await requireUser();
  const evaluations = await loadEvaluations(user.id);

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <h1>Evaluations</h1>
        <p>Manage evaluations you have created.</p>
      </div>

      <div className={styles.list}>
        <Link className={styles.submit} href="/app/evaluations/new">
          Create evaluation
        </Link>

        {evaluations.length === 0 ? (
          <div className={styles.empty}>No evaluations yet.</div>
        ) : (
          evaluations.map((evaluation) => (
            <div key={evaluation.id} className={styles.listItem}>
              <h3>{evaluation.name}</h3>
              {evaluation.description ? <p>{evaluation.description}</p> : null}
              <Link href={`/app/evaluations/${evaluation.id}`}>View details</Link>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
