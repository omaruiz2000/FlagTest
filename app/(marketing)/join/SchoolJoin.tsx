'use client';

import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { JoinButtons } from './JoinButtons';
import { joinSchoolLookup, joinSchoolTest } from '@/src/services/join';

type TestInfo = { id: string; title: string };

type Props = {
  evaluationId: string;
  evaluationName: string;
  tests: TestInfo[];
  isEvaluationClosed?: boolean;
  initialStudentCode?: string;
  initialRosterEntryId?: string | null;
  initialStatusMap?: Record<string, { status?: string; hasAnswers?: boolean }>;
  initialError?: string | null;
};

export function SchoolJoin({
  evaluationId,
  evaluationName,
  tests,
  isEvaluationClosed,
  initialStudentCode = '',
  initialRosterEntryId = null,
  initialStatusMap = {},
  initialError = null,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [studentCode, setStudentCode] = useState(initialStudentCode ?? '');
  const [rosterEntryId, setRosterEntryId] = useState<string | null>(initialRosterEntryId);
  const [statusMap, setStatusMap] = useState<Record<string, { status?: string; hasAnswers?: boolean }>>(initialStatusMap);
  const [error, setError] = useState<string | null>(initialError);
  const [loading, setLoading] = useState(false);

  const handleLookup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setRosterEntryId(null);
    setStatusMap({});
    try {
      const result = await joinSchoolLookup(evaluationId, studentCode.trim());
      setRosterEntryId(result.rosterEntryId);
      setStatusMap(result.statusMap || {});
      router.replace(`/join?e=${evaluationId}&code=${encodeURIComponent(studentCode.trim())}`);
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

      {rosterEntryId ? (
        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            marginBottom: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 10 }}>
            <div style={{ fontWeight: 600 }}>Student code verified</div>
            {studentCode ? <div style={{ color: '#475569' }}>{studentCode}</div> : null}
          </div>
          <button
            type="button"
            onClick={() => {
              setRosterEntryId(null);
              setStatusMap({});
              setStudentCode('');
              setError(null);
              const params = new URLSearchParams(searchParams?.toString());
              params.delete('code');
              router.replace(`/join?e=${evaluationId}${params.size ? `&${params.toString()}` : ''}`);
            }}
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              backgroundColor: '#fff',
              cursor: 'pointer',
            }}
          >
            Use a different code
          </button>
        </div>
      ) : (
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
      )}

      {rosterEntryId ? (
        <div style={{ marginTop: 32 }}>
          <JoinButtons
            evaluationId={evaluationId}
            tests={tests}
            statusMap={statusMap}
            isEvaluationClosed={isEvaluationClosed}
            onJoin={(testId) => joinSchoolTest(evaluationId, rosterEntryId, testId)}
          />
        </div>
      ) : null}
    </main>
  );
}
