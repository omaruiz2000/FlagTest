import { notFound } from 'next/navigation';
import { EvaluationDetails } from '@/src/components/evaluations/EvaluationDetails';
import { loadEvaluationDetails } from '@/src/db/repositories/evaluations';
import { requireUser } from '@/src/auth/session';

type PageProps = { params: { evaluationId: string } };

export default async function EvaluationPage({ params }: PageProps) {
  const user = await requireUser();
  const evaluation = await loadEvaluationDetails(params.evaluationId, { ownerUserId: user.id });

  if (!evaluation) {
    notFound();
  }

  return <EvaluationDetails evaluation={evaluation} viewer="owner" />;
}
