import { z } from 'zod';
import { ScenarioChoiceItemSchema, TestDefinitionSchema, type TestDefinition } from './schema';
import { scenarioChoiceAnswerSchema, scoreScenarioChoiceAnswer } from './widgets/scenario-choice.logic';

export type WidgetLogicEntry = {
  widgetType: string;
  definitionSchema: z.ZodTypeAny;
  answerSchema: z.ZodTypeAny;
  score: (value: unknown, definition?: unknown) => Array<{ dimension: string; delta: number }>;
};

export const widgetRegistry: Record<string, WidgetLogicEntry> = {
  scenario_choice: {
    widgetType: 'scenario_choice',
    definitionSchema: ScenarioChoiceItemSchema,
    answerSchema: scenarioChoiceAnswerSchema,
    score: (value, definition) => {
      const parsed = scenarioChoiceAnswerSchema.safeParse(value);
      if (!parsed.success) return [];
      return scoreScenarioChoiceAnswer(parsed.data, definition as any);
    },
  },
};

export function validateTestDefinition(definition: unknown): TestDefinition {
  return TestDefinitionSchema.parse(definition);
}
