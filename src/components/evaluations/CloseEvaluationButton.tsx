'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import styles from '@/app/(app)/app/evaluations/styles.module.css';

type Props = { evaluationId: string; isClosed: boolean };

export function CloseEvaluationButton({ evaluationId, isClosed }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (!isClosed) {
      // eslint-disable-next-line no-alert
      const confirmClose = window.confirm('Closing will block participants from starting or continuing tests. Continue?');
      if (!confirmClose) return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/evaluations/${evaluationId}/close`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: isClosed ? 'reopen' : 'close' }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || 'Unable to update evaluation');
        }

        router.refresh();
      } catch (err) {
        setError((err as Error).message);
      }
    });
  };

  return (
    <div className={styles.inlineForm}>
      <button type="button" className={styles.secondaryButton} onClick={handleClick} disabled={pending}>
        {pending ? 'Updating…' : isClosed ? 'Reopen evaluation' : 'Close evaluation'}
      </button>
      {error ? <span className={styles.error}>{error}</span> : null}
    </div>
  );
}
