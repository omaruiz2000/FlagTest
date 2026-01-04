export function buildAttemptKey(evaluationId: string, testDefinitionId: string, participantToken: string) {
  return `eval:${evaluationId}:test:${testDefinitionId}:inv:${participantToken}`;
}

export function parseParticipantTokenFromAttemptKey(attemptKey: string) {
  const marker = ':inv:';
  const markerIndex = attemptKey.lastIndexOf(marker);
  if (markerIndex === -1) return null;
  return attemptKey.slice(markerIndex + marker.length) || null;
}
