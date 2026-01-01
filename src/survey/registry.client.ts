'use client';

import React from 'react';
import { z } from 'zod';
import { ScenarioChoiceItemSchema } from './schema';
import { ScenarioChoiceWidget } from './widgets/scenario-choice.client';
import { scenarioChoiceAnswerSchema } from './widgets/scenario-choice.logic';
import { resolveStyle } from './styles/registry';

export type WidgetRendererProps<TDefinition> = {
  definition: TDefinition;
  onAnswer?: (value: unknown) => void;
};

export type WidgetRegistryEntry = {
  widgetType: string;
  definitionSchema: z.ZodTypeAny;
  answerSchema: z.ZodTypeAny;
  component: React.ComponentType<WidgetRendererProps<any>>;
};

export const widgetRegistry: Record<string, WidgetRegistryEntry> = {
  scenario_choice: {
    widgetType: 'scenario_choice',
    definitionSchema: ScenarioChoiceItemSchema,
    answerSchema: scenarioChoiceAnswerSchema,
    component: ScenarioChoiceWidget,
  },
};

export { resolveStyle };
