import { validateTestDefinition } from '../registry';

type ScoreValue = { dimension: string; value: number };
type SlotConfig = { key: string; rank: number };
type TestDefinitionWithSlots = {
  id: string;
  definition: unknown;
  camouflageSlots?: SlotConfig[];
};

export function computeSlotKeyForSession({
  testDefinition,
  scores,
}: {
  testDefinition: TestDefinitionWithSlots;
  scores: ScoreValue[];
}): string {
  const parsedDefinition = validateTestDefinition(testDefinition.definition);
  const orderedSlots = [...(testDefinition.camouflageSlots ?? [])].sort((a, b) => a.rank - b.rank);

  if (!orderedSlots.length) {
    return 'LOW';
  }

  const primaryDimensionId = parsedDefinition.dimensions?.[0]?.id ?? scores[0]?.dimension;
  const primaryScore = primaryDimensionId
    ? scores.find((score) => score.dimension === primaryDimensionId)?.value
    : scores[0]?.value;

  const normalizedScore = Math.min(100, Math.max(0, primaryScore ?? 0));
  const bucketSize = 100 / orderedSlots.length;
  const bucketIndex = Math.min(orderedSlots.length - 1, Math.floor(normalizedScore / bucketSize));
  const selectedSlot = orderedSlots[bucketIndex] ?? orderedSlots[0];

  return selectedSlot?.key ?? 'LOW';
}
