import { notFound, redirect } from 'next/navigation';
import type { ParticipantFeedbackMode } from '@prisma/client';
import { prisma } from '@/src/db/prisma';
import { readParticipantCookie, verifyParticipantTokenHash } from '@/src/auth/participant';
import { validateTestDefinition } from '@/src/survey/registry';
import { resolveStyle } from '@/src/survey/styles/registry';
import { computeSlotKeyForSession } from '@/src/survey/scoring/compute-slot';
import { joinParticipantSession, JoinError } from '@/src/services/server/join';
import { findParticipantTestStatuses } from '@/src/db/repositories/evaluations';
import { parseParticipantTokenFromAttemptKey } from '@/src/services/attemptKey';

type CompletionProps = { params: { sessionId: string } };

export default async function CompletionPage({ params }: CompletionProps) {
  const participant = readParticipantCookie();
  if (!participant || participant.sessionId !== params.sessionId) {
    redirect('/join');
  }

  const session = await prisma.testSession.findUnique({
    where: { id: params.sessionId },
    include: {
      testDefinition: {
        include: {
          camouflageOptions: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            include: { camouflageSet: true },
          },
          camouflageSlots: { orderBy: { rank: 'asc' } },
        },
      },
      evaluation: {
        select: {
          id: true,
          status: true,
          participantFeedbackMode: true,
          tests: {
            orderBy: { sortOrder: 'asc' },
            select: { testDefinitionId: true, sortOrder: true, camouflageSetId: true },
          },
        },
      },
      scores: true,
    },
  });

  if (!session || !verifyParticipantTokenHash(participant.token, session.participantTokenHash)) {
    redirect('/join');
  }

  if (session.evaluation?.status === 'DRAFT') {
    notFound();
  }

  if (session.status !== 'COMPLETED') {
    redirect(`/t/${session.id}`);
  }

  const testDefinition = validateTestDefinition(session.testDefinition.definition);
  const style = resolveStyle(testDefinition.styleId);
  const feedbackMode: ParticipantFeedbackMode = session.evaluation?.participantFeedbackMode ?? 'THANK_YOU_ONLY';

  const evaluation = session.evaluation;
  const participantToken = session.attemptKey ? parseParticipantTokenFromAttemptKey(session.attemptKey) : null;

  let nextTestDefinitionId: string | null = null;
  const nextMenuLink = evaluation?.id && participantToken ? `/join?e=${evaluation.id}&inv=${participantToken}` : '/join';

  if (participantToken && evaluation && evaluation.status === 'OPEN') {
    const orderedTests = evaluation.tests;
    const statusMap = await findParticipantTestStatuses(
      evaluation.id,
      participantToken,
      orderedTests.map((test) => test.testDefinitionId),
    );
    const currentIndex = orderedTests.findIndex((test) => test.testDefinitionId === session.testDefinitionId);

    for (let index = currentIndex + 1; index < orderedTests.length; index += 1) {
      const nextTestId = orderedTests[index].testDefinitionId;
      const statusInfo = statusMap[nextTestId];
      if (statusInfo?.status !== 'COMPLETED') {
        nextTestDefinitionId = nextTestId;
        break;
      }
    }
  }

  async function goToMenu() {
    'use server';
    redirect(nextMenuLink);
  }

  async function startNextTest() {
    'use server';
    if (!evaluation || !participantToken || !nextTestDefinitionId) {
      redirect(nextMenuLink);
    }

    try {
      const result = await joinParticipantSession(evaluation.id, participantToken, nextTestDefinitionId);
      redirect(`/t/${result.sessionId}`);
    } catch (error) {
      if (error instanceof JoinError && error.status === 409) {
        redirect(nextMenuLink);
      }
      throw error;
    }
  }

  const availableSets = session.testDefinition.camouflageOptions;
  const evaluationSetId = session.evaluation?.tests.find(
    (test) => test.testDefinitionId === session.testDefinitionId,
  )?.camouflageSetId;
  const selectedSetId = evaluationSetId ?? availableSets[0]?.camouflageSetId;
  const slotKey = computeSlotKeyForSession({ testDefinition: session.testDefinition, scores: session.scores });

  const [mapping, copy] = selectedSetId
    ? await Promise.all([
        prisma.testCamouflageMapping.findUnique({
          where: {
            testDefinitionId_camouflageSetId_slotKey: {
              testDefinitionId: session.testDefinitionId,
              camouflageSetId: selectedSetId,
              slotKey,
            },
          },
          include: { character: true },
        }),
        prisma.testCamouflageCopy.findUnique({
          where: {
            testDefinitionId_camouflageSetId_slotKey: {
              testDefinitionId: session.testDefinitionId,
              camouflageSetId: selectedSetId,
              slotKey,
            },
          },
        }),
      ])
    : [null, null];

  return (
    <div className={style.classicShell}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 12px', textAlign: 'center' }}>
        {feedbackMode === 'CAMOUFLAGE' && mapping && copy ? (
          <div style={{ display: 'grid', gap: 12 }}>
            <h1>¡Gracias por completar!</h1>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 18, background: '#fff' }}>
              {mapping.character.imageUrl ? (
                <img
                  src={mapping.character.imageUrl}
                  alt={mapping.character.title}
                  style={{ width: '100%', maxWidth: 260, margin: '0 auto', display: 'block' }}
                />
              ) : null}
              <p style={{ fontWeight: 600, margin: '12px 0 4px' }}>{mapping.character.title}</p>
              <h2 style={{ margin: 0 }}>{copy.headline}</h2>
              <p style={{ color: '#475569' }}>{copy.description}</p>
              {Array.isArray(copy.tips) && copy.tips.length ? (
                <div style={{ textAlign: 'left', display: 'grid', gap: 8 }}>
                  <p style={{ margin: '0 0 6px', fontWeight: 600 }}>Tips</p>
                  <ul style={{ margin: 0, paddingLeft: 18, color: '#334155' }}>
                    {copy.tips.map((tip: string) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
            <p>Puedes cerrar esta ventana.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            <h1>¡Gracias por completar!</h1>
            <p>Tu participación nos ayuda mucho. Puedes cerrar esta ventana.</p>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
          <form action={goToMenu}>
            <button
              type="submit"
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #0f172a',
                background: '#0f172a',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Go to test menu
            </button>
          </form>
          {nextTestDefinitionId ? (
            <form action={startNextTest}>
              <button
                type="submit"
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid #0f172a',
                  background: '#fff',
                  color: '#0f172a',
                  cursor: 'pointer',
                }}
              >
                Next test
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
}
