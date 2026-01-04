import { apiFetch } from './http';

export type JoinResponse = {
  sessionId?: string;
  ok?: boolean;
};

export async function joinWithCode(inv: string, evaluationId: string): Promise<JoinResponse> {
  return apiFetch<JoinResponse>('/api/join', {
    method: 'POST',
    body: { evaluationId, inv },
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
