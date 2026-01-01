'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from './styles.module.css';

type Option = {
  id: string;
  title: string;
  slug: string;
};

type Props = {
  evaluationId: string;
  evaluationTestId: string;
  options: Option[];
  initialSetId?: string | null;
};

export function CamouflageSetSelect({ evaluationId, evaluationTestId, options, initialSetId }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(initialSetId ?? '');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | undefined>();

  const handleChange = async (nextValue: string) => {
    setValue(nextValue);
    setStatus('saving');
    setError(undefined);

    const response = await fetch(
      `/api/evaluations/${evaluationId}/tests/${evaluationTestId}/camouflage-set`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ camouflageSetId: nextValue || null }),
      },
    );

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error || 'No se pudo guardar.');
      setStatus('error');
      return;
    }

    setStatus('saved');
    router.refresh();
  };

  return (
    <div className={styles.inlineForm}>
      <label className={styles.field} style={{ marginBottom: 0 }}>
        <span>Camouflage set</span>
        <select value={value} onChange={(event) => handleChange(event.target.value)} disabled={!options.length}>
          <option value="">Seleccionar set</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.title}
            </option>
          ))}
        </select>
      </label>
      {status === 'saving' ? <span className={styles.helper}>Guardando…</span> : null}
      {status === 'saved' ? <span className={styles.helper}>Actualizado</span> : null}
      {error ? <span className={styles.error}>{error}</span> : null}
    </div>
  );
}
