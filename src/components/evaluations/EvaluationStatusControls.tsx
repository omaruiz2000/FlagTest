'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import styles from '@/app/(app)/app/evaluations/styles.module.css';

type EvaluationStatus = 'DRAFT' | 'OPEN' | 'CLOSED';

type Props = { evaluationId: string; status: EvaluationStatus };

type Action = { label: string; status: EvaluationStatus; confirmMessage?: string };

const ACTIONS: Action[] = [
  { label: 'Publish (OPEN)', status: 'OPEN' },
  {
    label: 'Close (CLOSED)',
    status: 'CLOSED',
    confirmMessage: 'Closing will block participants from starting or continuing tests. Continue?',
  },
  {
    label: 'Unpublish (DRAFT)',
    status: 'DRAFT',
    confirmMessage: 'Unpublishing will hide the evaluation from participants. Continue?',
  },
];

export function EvaluationStatusControls({ evaluationId, status }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [targetStatus, setTargetStatus] = useState<EvaluationStatus | null>(null);

  const updateStatus = (nextStatus: EvaluationStatus) => {
    const action = ACTIONS.find((entry) => entry.status === nextStatus);
    if (action?.confirmMessage && !window.confirm(action.confirmMessage)) {
      return;
    }

    setError(null);
    setTargetStatus(nextStatus);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/evaluations/${evaluationId}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || 'Unable to update status');
        }

        router.refresh();
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setTargetStatus(null);
      }
    });
  };

  return (
    <div className={styles.inlineForm}>
      {ACTIONS.map((action) => (
        <button
          key={action.status}
          type="button"
          onClick={() => updateStatus(action.status)}
          disabled={pending || action.status === status}
          className={styles.secondaryButton}
        >
          {pending && targetStatus === action.status ? 'Updating…' : action.label}
        </button>
      ))}
      {error ? <span className={styles.error}>{error}</span> : null}
    </div>
  );
}
