'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { joinSchoolLookup } from '@/src/services/join';

type Props = {
  evaluationId: string;
  evaluationName: string;
  isEvaluationClosed?: boolean;
};

export function SchoolJoin({ evaluationId, evaluationName, isEvaluationClosed }: Props) {
  const router = useRouter();
  const [studentCode, setStudentCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLookup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await joinSchoolLookup(evaluationId, studentCode.trim());
      if (result?.rosterEntryId) {
        router.push(`/join?e=${evaluationId}&inv=${studentCode.trim()}`);
      }
    } catch (err) {
      setError((err as Error).message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: '72px 24px', maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 12 }}>Join your evaluation: {evaluationName}</h1>
      <p style={{ marginBottom: 24, color: '#475569' }}>Enter your student code to see your tests.</p>
      {isEvaluationClosed ? (
        <p style={{ marginTop: -8, marginBottom: 12, color: '#b91c1c', fontWeight: 600 }}>
          Evaluation closed. You cannot start or continue tests.
        </p>
      ) : null}
      <form onSubmit={handleLookup} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span>Student code</span>
          <input
            type="text"
            required
            value={studentCode}
            onChange={(event) => setStudentCode(event.target.value)}
            placeholder="e.g. CODE123"
            style={{ padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8 }}
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
          {loading ? 'Checking…' : 'Continue'}
        </button>
        {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
      </form>

    </main>
  );
}
