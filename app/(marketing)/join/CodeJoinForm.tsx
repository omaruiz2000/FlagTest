'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { joinWithCode } from '@/src/services/sessions';

type Props = { evaluationId: string; evaluationName: string };

export function CodeJoinForm({ evaluationId, evaluationName }: Props) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const heading = `Join your evaluation: ${evaluationName}`;
  const description = 'Enter your student code to continue.';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const trimmed = code.trim();
      const result = await joinWithCode(trimmed, evaluationId);
      if (result.ok) {
        router.push(`/join?e=${evaluationId}&inv=${encodeURIComponent(trimmed)}`);
        return;
      }
      setError('Invalid code/link');
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
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span>Student code</span>
          <input
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="e.g. 20185464"
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
