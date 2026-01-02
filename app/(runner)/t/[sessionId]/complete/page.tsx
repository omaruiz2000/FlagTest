import { redirect } from 'next/navigation';
import type { ParticipantFeedbackMode } from '@prisma/client';
import { prisma } from '@/src/db/prisma';
import { readParticipantCookie, verifyParticipantTokenHash } from '@/src/auth/participant';
import { validateTestDefinition } from '@/src/survey/registry';
import { resolveStyle } from '@/src/survey/styles/registry';
import { computeSlotKeyForSession } from '@/src/survey/scoring/compute-slot';

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
      evaluation: { select: { participantFeedbackMode: true, tests: true } },
      scores: true,
    },
  });

  if (!session || !verifyParticipantTokenHash(participant.token, session.participantTokenHash)) {
    redirect('/join');
  }

  if (session.status !== 'COMPLETED') {
    redirect(`/t/${session.id}`);
  }

  const testDefinition = validateTestDefinition(session.testDefinition.definition);
  const style = resolveStyle(testDefinition.styleId);
  const feedbackMode: ParticipantFeedbackMode = session.evaluation?.participantFeedbackMode ?? 'THANK_YOU_ONLY';

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
      </div>
    </div>
  );
}
