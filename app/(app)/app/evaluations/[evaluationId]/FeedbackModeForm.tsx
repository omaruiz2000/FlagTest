'use client';

import { useState, useTransition } from 'react';
import type { ParticipantFeedbackMode } from '@prisma/client';
import styles from '../styles.module.css';

type Props = {
  evaluationId: string;
  initialMode: ParticipantFeedbackMode;
};

export function FeedbackModeForm({ evaluationId, initialMode }: Props) {
  const [mode, setMode] = useState<ParticipantFeedbackMode>(initialMode);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const response = await fetch(`/api/evaluations/${evaluationId}/feedback-mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage(error?.error || 'No se pudo actualizar la configuración.');
        return;
      }

      setMessage('Modo actualizado.');
    });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.feedbackForm}>
      <select
        name="participantFeedbackMode"
        value={mode}
        onChange={(event) => setMode(event.target.value as ParticipantFeedbackMode)}
        disabled={pending}
      >
        <option value="THANK_YOU_ONLY">THANK_YOU_ONLY (recomendado para amigos/parejas/familia)</option>
        <option value="CAMOUFLAGE">CAMOUFLAGE (recomendado para niños/escuela)</option>
      </select>
      <button type="submit" className={styles.secondaryButton} disabled={pending}>
        {pending ? 'Guardando…' : 'Guardar'}
      </button>
      {message ? <span className={styles.helper}>{message}</span> : null}
    </form>
  );
}
