'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/src/services/http';
import { joinEvaluationTest, joinInviteTest } from '@/src/services/join';

type TestInfo = {
  id: string;
  title: string;
};

type Props = {
  evaluationId?: string;
  inviteCode?: string;
  tests: TestInfo[];
  selectedTestId?: string;
  statusMap?: Record<string, string>;
};

export function JoinButtons({ evaluationId, inviteCode, tests, selectedTestId, statusMap = {} }: Props) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, string>>(statusMap);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleJoin = async (testId: string) => {
    if (!evaluationId && !inviteCode) return;
    setLoadingId(testId);
    setErrors((prev) => ({ ...prev, [testId]: '' }));
    try {
      const result = inviteCode
        ? await joinInviteTest(inviteCode, testId)
        : await joinEvaluationTest(evaluationId as string, testId);
      setStatuses((prev) => ({ ...prev, [testId]: result.status ?? 'ACTIVE' }));
      router.push(`/t/${result.sessionId}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        if (error.message.toLowerCase().includes('completed')) {
          setStatuses((prev) => ({ ...prev, [testId]: 'COMPLETED' }));
        } else {
          setErrors((prev) => ({ ...prev, [testId]: error.message }));
        }
        return;
      }
      const message = error instanceof Error ? error.message : 'Unable to start';
      setErrors((prev) => ({ ...prev, [testId]: message }));
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {tests.map((test) => {
        const isSelected = selectedTestId === test.id;
        const status = statuses[test.id];
        const isCompleted = status === 'COMPLETED';
        const isActive = status === 'ACTIVE';
        const isCreated = status === 'CREATED';
        const label = isCompleted ? 'Completed' : isActive ? 'Continue' : isCreated ? 'Start' : 'Start';
        return (
          <div
            key={test.id}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 10,
              padding: 16,
              backgroundColor: isSelected ? '#f8fafc' : 'white',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{test.title}</div>
                {isSelected ? (
                  <div style={{ fontSize: 14, color: '#475569' }}>Selected test</div>
                ) : null}
              </div>
              <button
                type="button"
                disabled={loadingId === test.id || isCompleted}
                onClick={() => handleJoin(test.id)}
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid #111827',
                  backgroundColor: isCompleted ? '#e5e7eb' : '#111827',
                  color: isCompleted ? '#111827' : 'white',
                  cursor: isCompleted ? 'not-allowed' : 'pointer',
                  minWidth: 120,
                }}
              >
                {isCompleted ? 'Completed' : loadingId === test.id ? 'Joining…' : label}
              </button>
            </div>
            {errors[test.id] ? (
              <div style={{ color: 'crimson', marginTop: 8, fontSize: 14 }}>{errors[test.id]}</div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
