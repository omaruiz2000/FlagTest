import { apiFetch } from './http';

export type JoinEvaluationResponse = {
  sessionId: string;
  status?: string;
};

export async function joinEvaluationTest(evaluationId: string, testDefinitionId: string) {
  return apiFetch<JoinEvaluationResponse>('/api/join', {
    method: 'POST',
    body: { evaluationId, testDefinitionId },
  });
}
