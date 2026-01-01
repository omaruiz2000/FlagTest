'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import styles from '../../evaluations/styles.module.css';

async function callEndpoint(url: string, method: 'POST' | 'DELETE') {
  const res = await fetch(url, { method });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Request failed');
  }
}

export function EvaluationActions({ evaluationId, isDeleted }: { evaluationId: string; isDeleted: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSoftDelete = async () => {
    await callEndpoint(`/api/admin/evaluations/${evaluationId}/soft-delete`, 'POST');
  };

  const handleRestore = async () => {
    await callEndpoint(`/api/admin/evaluations/${evaluationId}/restore`, 'POST');
  };

  const handleHardDelete = async () => {
    // eslint-disable-next-line no-alert
    const ok = window.confirm('Permanently delete this evaluation? This cannot be undone.');
    if (!ok) return;
    await callEndpoint(`/api/admin/evaluations/${evaluationId}`, 'DELETE');
  };

  async function perform(action: () => Promise<void>) {
    try {
      await action();
      startTransition(() => router.refresh());
    } catch (error) {
      // eslint-disable-next-line no-alert
      alert((error as Error).message);
    }
  }

  return (
    <div className={styles.inlineForm}>
      {!isDeleted ? (
        <button type="button" onClick={() => perform(handleSoftDelete)} className={styles.secondaryButton} disabled={isPending}>
          Soft delete
        </button>
      ) : (
        <button type="button" onClick={() => perform(handleRestore)} className={styles.secondaryButton} disabled={isPending}>
          Restore
        </button>
      )}
      <button type="button" onClick={() => perform(handleHardDelete)} className={styles.secondaryButton} disabled={isPending}>
        Hard delete
      </button>
    </div>
  );
}
