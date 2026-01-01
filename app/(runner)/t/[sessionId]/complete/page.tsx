import { redirect } from 'next/navigation';
import type { ParticipantFeedbackMode } from '@prisma/client';
import { prisma } from '@/src/db/prisma';
import { readParticipantCookie, verifyParticipantTokenHash } from '@/src/auth/participant';
import { validateTestDefinition } from '@/src/survey/registry';
import { resolveStyle } from '@/src/survey/styles/registry';
import { resolveCamouflage } from '@/src/reports/camouflage';

type CompletionProps = { params: { sessionId: string } };

export default async function CompletionPage({ params }: CompletionProps) {
  const participant = readParticipantCookie();
  if (!participant || participant.sessionId !== params.sessionId) {
    redirect('/join');
  }

  const session = await prisma.testSession.findUnique({
    where: { id: params.sessionId },
    include: {
      testDefinition: true,
      evaluation: { select: { participantFeedbackMode: true } },
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

  const archetype = feedbackMode === 'CAMOUFLAGE'
    ? resolveCamouflage(session.scores.map((score) => ({ dimension: score.dimension, value: score.value })))
    : null;

  return (
    <div className={style.classicShell}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 12px', textAlign: 'center' }}>
        {feedbackMode === 'CAMOUFLAGE' && archetype ? (
          <div style={{ display: 'grid', gap: 12 }}>
            <h1>¡Gracias por completar!</h1>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 18, background: '#fff' }}>
              <p style={{ fontWeight: 600, margin: '0 0 4px' }}>Tu arquetipo</p>
              <h2 style={{ margin: 0 }}>{archetype.title}</h2>
              <p style={{ color: '#475569' }}>{archetype.description}</p>
              <div style={{ textAlign: 'left', display: 'grid', gap: 12 }}>
                <div>
                  <p style={{ margin: '0 0 6px', fontWeight: 600 }}>Rasgos destacados</p>
                  <ul style={{ margin: 0, paddingLeft: 18, color: '#334155' }}>
                    {archetype.traits.map((trait) => (
                      <li key={trait}>{trait}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p style={{ margin: '0 0 6px', fontWeight: 600 }}>Pequeños tips</p>
                  <ul style={{ margin: 0, paddingLeft: 18, color: '#334155' }}>
                    {archetype.tips.map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
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
