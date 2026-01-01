'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { joinWithCode } from '@/src/services/sessions';

export default function JoinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const evaluationId = searchParams.get('e') ?? undefined;
  const testDefinitionId = searchParams.get('t') ?? undefined;
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const heading = useMemo(() => {
    if (evaluationId && testDefinitionId) {
      return 'Join your evaluation';
    }
    return 'Join your FlagTest session';
  }, [evaluationId, testDefinitionId]);
  const description = useMemo(() => {
    if (evaluationId && testDefinitionId) {
      return 'Enter the code shared with you to start this evaluation.';
    }
    return 'Enter the code your teacher shared to start the short test.';
  }, [evaluationId, testDefinitionId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await joinWithCode(code.trim(), evaluationId, testDefinitionId);
      router.push(`/t/${result.sessionId}`);
    } catch (err) {
      setError((err as Error).message || 'Unable to join session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: '72px 24px', maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 16 }}>{heading}</h1>
      <p style={{ marginBottom: 24 }}>{description}</p>
      {evaluationId && testDefinitionId ? (
        <p style={{ marginBottom: 16, color: '#475569' }}>
          Joining evaluation {evaluationId} for test {testDefinitionId}
        </p>
      ) : null}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span>Join code</span>
          <input
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="e.g. CODE123"
            style={{ padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8 }}
            required
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px 16px',
            borderRadius: 10,
            backgroundColor: '#111827',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {loading ? 'Joining…' : 'Start test'}
        </button>
        {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
      </form>
    </main>
  );
}
