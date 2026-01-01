import { apiFetch } from './http';

export type JoinResponse = {
  sessionId: string;
};

export async function joinWithCode(code: string, evaluationId?: string, testDefinitionId?: string): Promise<JoinResponse> {
  const params = new URLSearchParams();
  if (evaluationId) params.set('e', evaluationId);
  if (testDefinitionId) params.set('t', testDefinitionId);
  const path = params.size ? `/api/join?${params.toString()}` : '/api/join';

  return apiFetch<JoinResponse>(path, {
    method: 'POST',
    body: { code },
  });
}

export type SaveAnswerPayload = {
  questionId: string;
  widgetType: string;
  answer: unknown;
};

export type SaveAnswerResponse = {
  ok: boolean;
  scores?: Array<{ dimension: string; value: number }>;
  status?: string;
};

export async function saveAnswer(sessionId: string, payload: SaveAnswerPayload): Promise<SaveAnswerResponse> {
  return apiFetch<SaveAnswerResponse>(`/api/sessions/${sessionId}/answers`, {
    method: 'POST',
    body: payload,
  });
}
