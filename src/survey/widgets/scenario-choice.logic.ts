import { z } from 'zod';
import type { ScenarioChoiceItem } from '../schema';

export const scenarioChoiceAnswerSchema = z.object({
  optionId: z.string(),
});

export type ScenarioChoiceAnswer = z.infer<typeof scenarioChoiceAnswerSchema>;

export function validateAnswer(value: unknown) {
  return scenarioChoiceAnswerSchema.parse(value);
}

export function scoreScenarioChoiceAnswer(value: ScenarioChoiceAnswer, definition?: ScenarioChoiceItem) {
  if (!definition?.scoring) return [];
  return definition.scoring;
}
