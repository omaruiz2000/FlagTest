'use client';

import { useMemo, useState } from 'react';
import { widgetRegistry } from '@/src/survey/registry.client';
import type { TestDefinition } from '@/src/survey/schema';
import { saveAnswer } from '@/src/services/sessions';
import { resolveStyle } from '@/src/survey/styles/registry';

type RunnerProps = {
  sessionId: string;
  testDefinition: TestDefinition;
  initialAnswers: Record<string, unknown>;
  initialScores: Array<{ dimension: string; value: number }>;
  status: string;
};

export function Runner({ sessionId, testDefinition, initialAnswers, initialScores, status: initialStatus }: RunnerProps) {
  const [answers, setAnswers] = useState<Record<string, unknown>>(initialAnswers);
  const [scores, setScores] = useState(initialScores);
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const currentIndex = useMemo(() => {
    const next = testDefinition.items.findIndex((item) => !answers[item.id]);
    return next === -1 ? testDefinition.items.length : next;
  }, [answers, testDefinition.items]);

  const style = resolveStyle(testDefinition.styleId);
  const completed = currentIndex >= testDefinition.items.length || status === 'COMPLETED';

  const handleSubmit = async (questionId: string, widgetType: string, value: unknown) => {
    if (submitting || completed) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await saveAnswer(sessionId, { questionId, widgetType, answer: value });
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
      if (response.scores) {
        setScores(response.scores);
      }
      if (response.status === 'COMPLETED') {
        setStatus('COMPLETED');
      }
    } catch (err) {
      setError((err as Error).message || 'Could not save answer');
    } finally {
      setSubmitting(false);
    }
  };

  if (completed) {
    return (
      <div className={style.className}>
        <div style={{ maxWidth: 640, margin: '0 auto', paddingTop: 48 }}>
          <h1>All done!</h1>
          <p style={{ marginBottom: 24 }}>Thanks for completing the test. Here are your dimension scores:</p>
          <div style={{ display: 'grid', gap: 12 }}>
            {scores.map((score) => (
              <div key={score.dimension} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 10 }}>
                <strong>{score.dimension}</strong>
                <div style={{ fontSize: 18 }}>{score.value}</div>
              </div>
            ))}
            {scores.length === 0 ? <p>No scores recorded yet.</p> : null}
          </div>
        </div>
      </div>
    );
  }

  const item = testDefinition.items[currentIndex];
  const registryEntry = widgetRegistry[item.widgetType];
  if (!registryEntry) {
    return (
      <div className={style.className}>
        <div style={{ maxWidth: 720, margin: '0 auto', paddingTop: 32 }}>
          <p>Unsupported widget type: {item.widgetType}</p>
        </div>
      </div>
    );
  }
  const WidgetComponent = registryEntry.component as any;

  return (
    <div className={style.className}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>Question {currentIndex + 1} of {testDefinition.items.length}</div>
          <div>{testDefinition.title}</div>
        </div>
        <WidgetComponent
          definition={item as any}
          onAnswer={(value: unknown) => handleSubmit(item.id, item.widgetType, value)}
        />
        {error ? <p style={{ color: 'crimson', marginTop: 12 }}>{error}</p> : null}
        {submitting ? <p style={{ marginTop: 8 }}>Saving…</p> : null}
      </div>
    </div>
  );
}
