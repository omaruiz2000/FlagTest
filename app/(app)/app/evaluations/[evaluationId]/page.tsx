import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/src/db/prisma';
import { requireUser } from '@/src/auth/session';
import styles from '../styles.module.css';

async function loadEvaluation(evaluationId: string) {
  return prisma.evaluation.findUnique({
    where: { id: evaluationId },
    include: {
      tests: {
        orderBy: { sortOrder: 'asc' },
        include: { testDefinition: { select: { id: true, title: true, description: true } } },
      },
    },
  });
}

export default async function EvaluationPage({ params }: { params: { evaluationId: string } }) {
  await requireUser();
  const evaluation = await loadEvaluation(params.evaluationId);

  if (!evaluation) {
    notFound();
  }

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <h1>{evaluation.name}</h1>
        <p>{evaluation.description || 'Evaluation details and join links.'}</p>
      </div>

      <div className={styles.list}>
        {evaluation.tests.map((item) => {
          const joinHref = `/join?e=${evaluation.id}&t=${item.testDefinitionId}`;
          return (
            <div key={item.id} className={styles.listItem}>
              <h3>{item.testDefinition.title}</h3>
              {item.testDefinition.description ? <p>{item.testDefinition.description}</p> : null}
              <ul className={styles.linkList}>
                <li>
                  Join link: <Link href={joinHref}>{joinHref}</Link>
                </li>
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
