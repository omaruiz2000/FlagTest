import Link from 'next/link';
import { prisma } from '@/src/db/prisma';
import { requireUser } from '@/src/auth/session';
import { isSystemAdmin } from '@/src/auth/admin';
import styles from '../../evaluations/styles.module.css';

async function loadTests() {
  return prisma.testDefinition.findMany({ orderBy: { title: 'asc' } });
}

export default async function AdminTestsPage() {
  const user = await requireUser();
  if (!isSystemAdmin(user)) {
    return (
      <section className={styles.card}>
        <h2>Tests</h2>
        <p className={styles.helper}>Not authorized.</p>
      </section>
    );
  }

  const tests = await loadTests();

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <h1>Tests</h1>
        <p>Configure camouflage options per test.</p>
      </div>
      <div className={styles.card}>
        {tests.length ? (
          <ul className={styles.testList}>
            {tests.map((test) => (
              <li key={test.id} className={styles.testRow}>
                <div>
                  <div className={styles.testTitle}>{test.title}</div>
                  <p className={styles.testDescription}>{test.description}</p>
                  <p className={styles.helper}>
                    {test.slug} v{test.version}
                  </p>
                </div>
                <Link className={styles.secondaryButton} href={`/app/admin/tests/${test.id}/camouflage`}>
                  Configure camouflage
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.helper}>No tests available.</p>
        )}
      </div>
    </section>
  );
}
