import { z } from 'zod';

export const ScenarioChoiceOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
});

export const ScenarioChoiceItemSchema = z.object({
  id: z.string(),
  widgetType: z.literal('scenario_choice'),
  prompt: z.string(),
  scenario: z.string().optional(),
  options: z.array(ScenarioChoiceOptionSchema).min(2).max(3),
  scoring: z
    .array(
      z.object({
        dimension: z.string(),
        delta: z.number(),
      }),
    )
    .optional(),
});

export const TestDefinitionV1Schema = z.object({
  version: z.literal(1),
  slug: z.string(),
  title: z.string(),
  styleId: z.string().default('classic'),
  items: z.array(ScenarioChoiceItemSchema),
  metadata: z.record(z.unknown()).optional(),
});

export const TestDefinitionSchema = z.discriminatedUnion('version', [TestDefinitionV1Schema]);

export type TestDefinition = z.infer<typeof TestDefinitionSchema>;
export type ScenarioChoiceItem = z.infer<typeof ScenarioChoiceItemSchema>;
export type ScenarioChoiceOption = z.infer<typeof ScenarioChoiceOptionSchema>;
