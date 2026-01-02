'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import styles from '@/app/(app)/app/evaluations/styles.module.css';

type Props = {
  evaluationId: string;
  inviteId: string;
  testDefinitionId: string;
};

export function ResetTestButton({ evaluationId, inviteId, testDefinitionId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleReset = async () => {
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm('Reset this attempt? Answers and scores will be removed.');
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/evaluations/${evaluationId}/reset`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inviteId, testDefinitionId }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || 'Unable to reset');
        }

        router.refresh();
      } catch (err) {
        setError((err as Error).message);
      }
    });
  };

  return (
    <div className={styles.inlineForm}>
      <button type="button" className={styles.secondaryButton} onClick={handleReset} disabled={pending}>
        {pending ? 'Resetting…' : 'Reset test'}
      </button>
      {error ? <span className={styles.error}>{error}</span> : null}
    </div>
  );
}
