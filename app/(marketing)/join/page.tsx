import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { getEvaluationWithTests, findEvaluationTestStatuses } from '@/src/db/repositories/evaluations';
import { CodeJoinForm } from './CodeJoinForm';
import { JoinButtons } from './JoinButtons';

type JoinPageProps = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

function getParamValue(value?: string | string[] | null) {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export default async function JoinPage({ searchParams }: JoinPageProps) {
  const evaluationId = getParamValue(searchParams?.e);
  const selectedTestId = getParamValue(searchParams?.t);

  if (!evaluationId) {
    return <CodeJoinForm />;
  }

  const evaluation = await getEvaluationWithTests(evaluationId);
  if (!evaluation) {
    return notFound();
  }

  const tests = evaluation.tests.map((evaluationTest) => ({
    id: evaluationTest.testDefinition.id,
    title: evaluationTest.testDefinition.title,
  }));

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
      {selectedTest ? (
        <p style={{ marginBottom: 16, color: '#475569' }}>Selected test: {selectedTest.title}</p>
      ) : null}
      <JoinButtons
        evaluationId={evaluation.id}
        tests={visibleTests.length ? visibleTests : tests}
        selectedTestId={selectedTestId}
        statusMap={statusMap}
      />
    </main>
  );
}
