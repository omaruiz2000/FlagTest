import { notFound } from 'next/navigation';
import { prisma } from '@/src/db/prisma';
import { hashInviteToken } from '@/src/auth/inviteTokens';
import { findParticipantTestStatuses } from '@/src/db/repositories/evaluations';
import { CodeJoinForm } from './CodeJoinForm';
import { JoinButtons } from './JoinButtons';

function getParamValue(value?: string | string[] | null) {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

function InvalidLink() {
  return (
    <main style={{ padding: '72px 24px', maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 12 }}>Invalid code/link</h1>
      <p style={{ color: '#475569' }}>Please check your invitation or contact your organizer.</p>
    </main>
  );
}

export default async function JoinPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const evaluationId = getParamValue(searchParams?.e);
  const inv = getParamValue(searchParams?.inv);
  const selectedTestId = getParamValue(searchParams?.t);

  if (!evaluationId) {
    return notFound();
  }

  const evaluation = await prisma.evaluation.findFirst({
    where: { id: evaluationId, deletedAt: null },
    select: {
      id: true,
      name: true,
      status: true,
      tests: {
        orderBy: { sortOrder: 'asc' },
        include: { testDefinition: { select: { id: true, title: true } } },
      },
      invites: inv
        ? { where: { tokenHash: hashInviteToken(inv) }, select: { id: true, token: true, alias: true } }
        : undefined,
      rosterEntries: inv ? { where: { studentCode: inv }, select: { id: true, studentCode: true } } : undefined,
      _count: { select: { rosterEntries: true } },
    },
  });

  if (!evaluation || evaluation.status === 'DRAFT') {
    return notFound();
  }

  const isSchool = evaluation._count.rosterEntries > 0;

  if (!inv) {
    if (isSchool) {
      return <CodeJoinForm evaluationId={evaluation.id} evaluationName={evaluation.name} />;
    }
    return <InvalidLink />;
  }

  const tests = evaluation.tests.map((evaluationTest) => ({
    id: evaluationTest.testDefinition.id,
    title: evaluationTest.testDefinition.title,
  }));

  const isClosed = evaluation.status === 'CLOSED';
  const rosterEntry = evaluation.rosterEntries?.[0];
  const invite = evaluation.invites?.[0];

  if (isSchool ? !rosterEntry : !invite) {
    return <InvalidLink />;
  }

  const statusMap = await findParticipantTestStatuses(
    evaluation.id,
    inv,
    evaluation.tests.map((test) => test.testDefinition.id),
  );

  const visibleTests = selectedTestId ? tests.filter((test) => test.id === selectedTestId) : tests;
  const selectedTest = selectedTestId ? tests.find((test) => test.id === selectedTestId) : undefined;

  return (
    <main style={{ padding: '72px 24px', maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 12 }}>Join your evaluation: {evaluation.name}</h1>
      {invite?.alias ? (
        <p style={{ margin: '0 0 6px', color: '#475569' }}>Invite: {invite.alias}</p>
      ) : null}
      <p style={{ marginBottom: 24, color: '#475569' }}>
        Select a test below to start your evaluation.
      </p>
      {isClosed ? (
        <p style={{ marginTop: -12, marginBottom: 12, color: '#b91c1c', fontWeight: 600 }}>
          Evaluation closed. You cannot start or continue tests.
        </p>
      ) : null}
      {selectedTest ? (
        <p style={{ marginBottom: 16, color: '#475569' }}>Selected test: {selectedTest.title}</p>
      ) : null}
      <JoinButtons
        evaluationId={evaluation.id}
        participantToken={inv}
        tests={visibleTests.length ? visibleTests : tests}
        selectedTestId={selectedTestId}
        statusMap={statusMap}
        isEvaluationClosed={isClosed}
      />
    </main>
  );
}
