'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/src/services/http';
import { JoinEvaluationResponse, joinEvaluationTest, joinInviteTest } from '@/src/services/join';

type TestInfo = {
  id: string;
  title: string;
};

type StatusInfo = { status?: string; hasAnswers?: boolean };

type Props = {
  evaluationId?: string;
  inviteToken?: string;
  tests: TestInfo[];
  selectedTestId?: string;
  statusMap?: Record<string, StatusInfo>;
  isEvaluationClosed?: boolean;
  onJoin?: (testId: string) => Promise<JoinEvaluationResponse>;
};

export function JoinButtons({
  evaluationId,
  inviteToken,
  tests,
  selectedTestId,
  statusMap = {},
  isEvaluationClosed,
  onJoin,
}: Props) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, StatusInfo>>(statusMap);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleJoin = async (testId: string) => {
    if (!evaluationId && !inviteToken) return;
    if (isEvaluationClosed) {
      setErrors((prev) => ({ ...prev, [testId]: 'Evaluation closed' }));
      return;
    }
    setLoadingId(testId);
    setErrors((prev) => ({ ...prev, [testId]: '' }));
    try {
      const result = onJoin
        ? await onJoin(testId)
        : inviteToken
          ? await joinInviteTest(evaluationId as string, inviteToken, testId)
          : await joinEvaluationTest(evaluationId as string, testId);
      setStatuses((prev) => ({ ...prev, [testId]: { status: result.status ?? 'ACTIVE', hasAnswers: false } }));
      router.push(`/t/${result.sessionId}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        if (error.message.toLowerCase().includes('completed')) {
          setStatuses((prev) => ({ ...prev, [testId]: { status: 'COMPLETED', hasAnswers: true } }));
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
        const statusInfo = statuses[test.id];
        const status = statusInfo?.status;
        const hasAnswers = statusInfo?.hasAnswers;
        const isCompleted = status === 'COMPLETED';
        const isContinuable = status === 'ACTIVE' || (status !== undefined && hasAnswers);
        const label = isCompleted ? 'Completed' : isContinuable ? 'Continue' : 'Start';
        const isDisabled = isEvaluationClosed || isCompleted || loadingId === test.id;
        const closedMessage = isEvaluationClosed && !isCompleted ? 'Evaluation closed' : null;
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
                disabled={isDisabled}
                onClick={() => handleJoin(test.id)}
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid #111827',
                  backgroundColor: isCompleted || isEvaluationClosed ? '#e5e7eb' : '#111827',
                  color: isCompleted || isEvaluationClosed ? '#111827' : 'white',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  minWidth: 120,
                }}
              >
                {isCompleted ? 'Completed' : loadingId === test.id ? 'Joining…' : isEvaluationClosed ? 'Closed' : label}
              </button>
            </div>
            {closedMessage ? (
              <div style={{ color: '#b91c1c', marginTop: 8, fontSize: 14 }}>{closedMessage}</div>
            ) : errors[test.id] ? (
              <div style={{ color: 'crimson', marginTop: 8, fontSize: 14 }}>{errors[test.id]}</div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
