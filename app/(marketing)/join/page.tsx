import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import {
  getEvaluationWithTests,
  findEvaluationTestStatuses,
  findInviteByTokenWithEvaluation,
  findInviteTestStatuses,
} from '@/src/db/repositories/evaluations';
import { CodeJoinForm } from './CodeJoinForm';
import { JoinButtons } from './JoinButtons';
import { SchoolJoin } from './SchoolJoin';

type JoinPageProps = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

function getParamValue(value?: string | string[] | null) {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export default async function JoinPage({ searchParams }: JoinPageProps) {
  const inviteToken = getParamValue(searchParams?.inv);
  const evaluationId = getParamValue(searchParams?.e);
  const selectedTestId = getParamValue(searchParams?.t);

  if (inviteToken) {
    if (!evaluationId) {
      return notFound();
    }

    const invite = await findInviteByTokenWithEvaluation(inviteToken);
    if (!invite || !invite.evaluation || invite.evaluation.id !== evaluationId) {
      return notFound();
    }

    if (invite.evaluation.status === 'DRAFT') {
      return notFound();
    }

    const tests = invite.evaluation.tests.map((evaluationTest) => ({
      id: evaluationTest.testDefinition.id,
      title: evaluationTest.testDefinition.title,
    }));

    const isClosed = invite.evaluation.status === 'CLOSED';

    const statusMap = await findInviteTestStatuses(
      invite.id,
      invite.evaluation.tests.map((test) => test.testDefinition.id),
    );

    const visibleTests = selectedTestId
      ? tests.filter((test) => test.id === selectedTestId)
      : tests;

    const selectedTest = selectedTestId
      ? tests.find((test) => test.id === selectedTestId)
      : undefined;

    return (
      <main style={{ padding: '72px 24px', maxWidth: 720, margin: '0 auto' }}>
        <h1 style={{ marginBottom: 12 }}>
          Join your evaluation: {invite.evaluation.name}
        </h1>
        {invite.alias ? (
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
          inviteToken={invite.token}
          evaluationId={invite.evaluation.id}
          tests={visibleTests.length ? visibleTests : tests}
          selectedTestId={selectedTestId}
          statusMap={statusMap}
          isEvaluationClosed={isClosed}
        />
      </main>
    );
  }

  if (!evaluationId) {
    return <CodeJoinForm />;
  }

  const evaluation = await getEvaluationWithTests(evaluationId);
  if (!evaluation) {
    return notFound();
  }

  const isSchoolBundle = evaluation.testPackage?.slug === 'school-bundle';
  const tests = evaluation.tests.map((evaluationTest) => ({
    id: evaluationTest.testDefinition.id,
    title: evaluationTest.testDefinition.title,
  }));

  const isClosed = evaluation.status === 'CLOSED';
  if (isSchoolBundle) {
    return (
      <SchoolJoin
        evaluationId={evaluation.id}
        evaluationName={evaluation.name}
        tests={tests}
        isEvaluationClosed={isClosed}
      />
    );
  }
  const participantId = cookies().get(`ft_pid_${evaluation.id}`)?.value;
  const statusMap = participantId
    ? await findEvaluationTestStatuses(
        evaluation.id,
        participantId,
        evaluation.tests.map((test) => test.testDefinition.id),
      )
    : {};

  const visibleTests = selectedTestId
    ? tests.filter((test) => test.id === selectedTestId)
    : tests;

  const selectedTest = selectedTestId
    ? tests.find((test) => test.id === selectedTestId)
    : undefined;

  return (
    <main style={{ padding: '72px 24px', maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 12 }}>Join your evaluation: {evaluation.name}</h1>
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
        tests={visibleTests.length ? visibleTests : tests}
        selectedTestId={selectedTestId}
        statusMap={statusMap}
        isEvaluationClosed={isClosed}
      />
    </main>
  );
}
