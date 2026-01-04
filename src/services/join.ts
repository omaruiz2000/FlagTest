import { apiFetch } from './http';

export type JoinEvaluationResponse = {
  sessionId: string;
  status?: string;
};

export type SchoolLookupResponse = {
  rosterEntryId: string;
  statusMap: Record<string, { status?: string; hasAnswers?: boolean }>;
  evaluationStatus?: string;
};

export async function joinEvaluationTest(evaluationId: string, testDefinitionId: string) {
  return apiFetch<JoinEvaluationResponse>('/api/join', {
    method: 'POST',
    body: { evaluationId, testDefinitionId },
  });
}

export async function joinInviteTest(evaluationId: string, inviteToken: string, testDefinitionId: string) {
  return apiFetch<JoinEvaluationResponse>('/api/join/invite', {
    method: 'POST',
    body: { evaluationId, inviteToken, testDefinitionId },
  });
}

export async function joinSchoolLookup(evaluationId: string, studentCode: string) {
  return apiFetch<SchoolLookupResponse>('/api/join/school/lookup', {
    method: 'POST',
    body: { evaluationId, studentCode },
  });
}

export async function joinSchoolTest(evaluationId: string, studentCode: string, testDefinitionId: string) {
  return apiFetch<JoinEvaluationResponse>('/api/join/school', {
    method: 'POST',
    body: { evaluationId, studentCode, testDefinitionId },
  });
}
