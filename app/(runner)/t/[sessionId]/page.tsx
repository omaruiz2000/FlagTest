import { notFound, redirect } from 'next/navigation';
import { Runner } from './Runner';
import { prisma } from '@/src/db/prisma';
import { readParticipantCookie, verifyParticipantTokenHash } from '@/src/auth/participant';
import { validateTestDefinition } from '@/src/survey/registry';
import { parseParticipantTokenFromAttemptKey } from '@/src/services/attemptKey';

export default async function RunnerSessionPage({ params }: { params: { sessionId: string } }) {
  const participant = readParticipantCookie();
  if (!participant || participant.sessionId !== params.sessionId) {
    redirect('/join');
  }

  const session = await prisma.testSession.findUnique({
    where: { id: params.sessionId },
    include: {
      testDefinition: true,
      answers: true,
      scores: true,
      evaluation: { select: { id: true, status: true } },
    },
  });

  if (!session) {
    notFound();
  }

  if (!verifyParticipantTokenHash(participant.token, session.participantTokenHash)) {
    redirect('/join');
  }

  if (session.evaluation?.status === 'DRAFT') {
    notFound();
  }

  if (session.status === 'COMPLETED') {
    redirect(`/t/${session.id}/complete`);
  }

  if (session.evaluation?.status === 'CLOSED') {
    const tokenFromAttempt = session.attemptKey ? parseParticipantTokenFromAttemptKey(session.attemptKey) : null;
    const target = session.evaluation?.id && tokenFromAttempt
      ? `/join?e=${session.evaluation.id}&inv=${tokenFromAttempt}`
      : '/join';
    redirect(target);
  }

  const testDefinition = validateTestDefinition(session.testDefinition.definition);
  const initialAnswers = Object.fromEntries(session.answers.map((answer) => [answer.questionId, answer.payload]));
  const initialScores = session.scores.map((score) => ({ dimension: score.dimension, value: score.value }));

  return (
    <Runner
      sessionId={session.id}
      testDefinition={testDefinition}
      initialAnswers={initialAnswers}
      initialScores={initialScores}
      status={session.status}
    />
  );
}
