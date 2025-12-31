import React from 'react';
import { z } from 'zod';
import { ScenarioChoiceItemSchema, TestDefinitionSchema, type TestDefinition } from './schema';
import { ScenarioChoiceWidget, scenarioChoiceAnswerSchema, scenarioChoiceScoringStub } from './widgets/scenario-choice';
import classicStyles from './styles/classic.module.css';

export type WidgetRendererProps<TDefinition> = {
  definition: TDefinition;
  onAnswer?: (value: unknown) => void;
};

export type WidgetRegistryEntry = {
  widgetType: string;
  definitionSchema: z.ZodTypeAny;
  answerSchema: z.ZodTypeAny;
  component: React.ComponentType<WidgetRendererProps<any>>;
  score: (value: unknown, definition?: unknown) => Array<{ dimension: string; delta: number }>;
};

export const widgetRegistry: Record<string, WidgetRegistryEntry> = {
  scenario_choice: {
    widgetType: 'scenario_choice',
    definitionSchema: ScenarioChoiceItemSchema,
    answerSchema: scenarioChoiceAnswerSchema,
    component: ScenarioChoiceWidget,
    score: scenarioChoiceScoringStub,
  },
};

export type StyleRegistryEntry = {
  id: string;
  label: string;
  className: string;
  description?: string;
};

export const styleRegistry: Record<string, StyleRegistryEntry> = {
  classic: {
    id: 'classic',
    label: 'Classic',
    className: classicStyles.classicShell,
    description: 'Neutral layout with balanced spacing.',
  },
};

export function resolveStyle(styleId?: string) {
  if (styleId && styleRegistry[styleId]) {
    return styleRegistry[styleId];
  }
  return styleRegistry.classic;
}

export function validateTestDefinition(definition: unknown): TestDefinition {
  return TestDefinitionSchema.parse(definition);
}
