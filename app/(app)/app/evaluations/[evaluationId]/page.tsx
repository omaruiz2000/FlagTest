import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/src/db/prisma';
import { requireUser } from '@/src/auth/session';
import { CopyInviteLinksButton } from './InviteActions';
import styles from '../styles.module.css';

const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function loadEvaluation(evaluationId: string, ownerId: string) {
  return prisma.evaluation.findFirst({
    where: { id: evaluationId, ownerUserId: ownerId },
    include: {
      tests: {
        orderBy: { sortOrder: 'asc' },
        include: { testDefinition: { select: { id: true, title: true, description: true } } },
      },
      invites: {
        orderBy: { createdAt: 'asc' },
        include: {
          sessions: { select: { status: true, testDefinitionId: true } },
        },
      },
    },
  });
}

export default async function EvaluationPage({ params }: { params: { evaluationId: string } }) {
  const user = await requireUser();
  const evaluation = await loadEvaluation(params.evaluationId, user.id);

  if (!evaluation) {
    notFound();
  }

  const totalTests = evaluation.tests.length;
  const invites = evaluation.invites.map((invite, index) => {
    const completedTests = evaluation.tests.reduce((count, test) => {
      const session = invite.sessions.find((session) => session.testDefinitionId === test.testDefinitionId);
      return session?.status === 'COMPLETED' ? count + 1 : count;
    }, 0);

    return {
      id: invite.id,
      label: invite.label || `Invite #${index + 1}`,
      code: invite.code,
      link: `${APP_BASE_URL}/join?inv=${invite.code}`,
      completedTests,
    };
  });

  const inviteLinks = invites.map(({ label, link }) => ({ label, link }));
  const completedInvites = invites.filter((invite) => totalTests > 0 && invite.completedTests === totalTests).length;

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <h1>{evaluation.name}</h1>
        <p>{evaluation.description || 'Evaluation details and join links.'}</p>
      </div>

      <div className={styles.card}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 style={{ margin: 0 }}>Invites</h2>
            <p className={styles.helper}>
              Created {invites.length} / Completed {completedInvites}
            </p>
          </div>
          <div className={styles.inviteActions}>
            <CopyInviteLinksButton invites={inviteLinks} />
            <a
              href={`/api/evaluations/${evaluation.id}/invites.csv`}
              className={styles.secondaryButton}
            >
              Download CSV
            </a>
          </div>
        </div>

        {invites.length ? (
          <table className={styles.inviteTable}>
            <thead>
              <tr>
                <th>Label</th>
                <th>Invite link</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((invite) => {
                const statusLabel = `${invite.completedTests}/${totalTests} tests completed`;
                return (
                  <tr key={invite.id}>
                    <td>
                      <span className={styles.pill}>{invite.label}</span>
                    </td>
                    <td>
                      <a className={styles.monoLink} href={invite.link}>
                        {invite.link}
                      </a>
                    </td>
                    <td>{statusLabel}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className={styles.empty}>No invites created for this evaluation.</p>
        )}
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
