import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EvaluationDetails } from '@/src/components/evaluations/EvaluationDetails';
import { requirePlatformAdmin } from '@/src/auth/admin';
import { loadEvaluationDetails } from '@/src/db/repositories/evaluations';
import styles from '../../../evaluations/styles.module.css';

type PageProps = { params: { evaluationId: string } };

export default async function AdminEvaluationDetailPage({ params }: PageProps) {
  await requirePlatformAdmin();
  const evaluation = await loadEvaluationDetails(params.evaluationId, { includeDeleted: false });

  if (!evaluation) {
    notFound();
  }

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Evaluation details</h1>
          <p className={styles.helper}>Platform-level view with invites, results, and camouflage.</p>
        </div>
        <Link className={styles.secondaryButton} href="/app/admin/evaluations">
          Back to list
        </Link>
      </div>

      <EvaluationDetails evaluation={evaluation} viewer="admin" showResetControls />
    </section>
  );
}
