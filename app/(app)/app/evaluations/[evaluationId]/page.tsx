import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/src/db/prisma';
import { requireUser } from '@/src/auth/session';
import { CopyInviteLinksButton } from './InviteActions';
import { FeedbackModeForm } from './FeedbackModeForm';
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
      sessions: {
        where: { evaluationId },
        include: {
          invite: { select: { label: true } },
          testDefinition: { select: { id: true, title: true } },
          scores: true,
        },
        orderBy: { createdAt: 'desc' },
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

  const aggregateByTest = evaluation.sessions
    .filter((session) => session.status === 'COMPLETED')
    .reduce<Record<string, { title: string; totals: Record<string, { sum: number; count: number }> }>>((acc, session) => {
      if (!session.testDefinition) return acc;
      if (!acc[session.testDefinitionId]) {
        acc[session.testDefinitionId] = { title: session.testDefinition.title, totals: {} };
      }
      session.scores.forEach((score) => {
        const entry = acc[session.testDefinitionId].totals[score.dimension] ?? { sum: 0, count: 0 };
        acc[session.testDefinitionId].totals[score.dimension] = { sum: entry.sum + score.value, count: entry.count + 1 };
      });
      return acc;
    }, {});

  const aggregates = Object.entries(aggregateByTest).map(([testDefinitionId, value]) => ({
    testDefinitionId,
    title: value.title,
    dimensions: Object.entries(value.totals).map(([dimension, totals]) => ({
      dimension,
      average: totals.sum / Math.max(totals.count, 1),
    })),
  }));

  const sessions = evaluation.sessions.map((session) => ({
    id: session.id,
    label: session.invite?.label || 'Open participant',
    testTitle: session.testDefinition?.title || 'Test',
    status: session.status,
    completedAt: session.completedAt,
    scores: session.scores,
  }));

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <h1>{evaluation.name}</h1>
        <p>{evaluation.description || 'Evaluation details and join links.'}</p>
      </div>

      <div className={styles.card}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 style={{ margin: 0 }}>Participant feedback</h2>
            <p className={styles.helper}>Define what participants see when they finish.</p>
          </div>
          <FeedbackModeForm evaluationId={evaluation.id} initialMode={evaluation.participantFeedbackMode} />
        </div>
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

      <div className={styles.card}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 style={{ margin: 0 }}>Results</h2>
            <p className={styles.helper}>Visible solo para el organizador.</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <h3 style={{ margin: '6px 0' }}>Sessions</h3>
            {sessions.length ? (
              <table className={styles.resultsTable}>
                <thead>
                  <tr>
                    <th>Participant</th>
                    <th>Test</th>
                    <th>Status</th>
                    <th>Completed at</th>
                    <th>Scores</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id}>
                      <td>{session.label}</td>
                      <td>{session.testTitle}</td>
                      <td>{session.status}</td>
                      <td>{session.completedAt ? session.completedAt.toLocaleString() : '—'}</td>
                      <td>
                        {session.scores.length ? (
                          <div className={styles.inlineList}>
                            {session.scores.map((score) => (
                              <span key={score.dimension} className={styles.pill}>
                                {score.dimension}: {score.value}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className={styles.helper}>No scores</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className={styles.empty}>No sessions recorded yet.</p>
            )}
          </div>

          <div>
            <h3 style={{ margin: '6px 0' }}>Aggregate (MVP)</h3>
            {aggregates.length ? (
              <div className={styles.list}>
                {aggregates.map((aggregate) => (
                  <div key={aggregate.testDefinitionId} className={styles.scoresTable}>
                    <div className={styles.scoresTableHeader}>
                      <strong>{aggregate.title}</strong>
                      <span className={styles.helper}>Average per dimension</span>
                    </div>
                    {aggregate.dimensions.length ? (
                      <table className={styles.resultsTable}>
                        <thead>
                          <tr>
                            <th>Dimension</th>
                            <th>Average</th>
                          </tr>
                        </thead>
                        <tbody>
                          {aggregate.dimensions.map((dimension) => (
                            <tr key={dimension.dimension}>
                              <td>{dimension.dimension}</td>
                              <td>{dimension.average.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className={styles.helper}>No completed scores yet.</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.empty}>Complete sessions to see aggregates.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
