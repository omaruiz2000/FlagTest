'use client';

import { JoinButtons } from './JoinButtons';
import { joinSchoolTest } from '@/src/services/join';

type TestInfo = {
  id: string;
  title: string;
};

type StatusInfo = { status?: string; hasAnswers?: boolean };

type Props = {
  evaluationId: string;
  studentCode: string;
  tests: TestInfo[];
  statusMap?: Record<string, StatusInfo>;
  selectedTestId?: string;
  isEvaluationClosed?: boolean;
};

export function SchoolJoinMenu({
  evaluationId,
  studentCode,
  tests,
  statusMap,
  selectedTestId,
  isEvaluationClosed,
}: Props) {
  return (
    <JoinButtons
      evaluationId={evaluationId}
      tests={tests}
      statusMap={statusMap}
      selectedTestId={selectedTestId}
      isEvaluationClosed={isEvaluationClosed}
      onJoin={(testId) => joinSchoolTest(evaluationId, studentCode, testId)}
    />
  );
}
