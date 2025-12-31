# Widgets

Each widget defines how a test item is rendered, validated, and scored.

To add a widget:
1. Create a new component under `src/survey/widgets/` and export:
   - `definitionSchema` (Zod schema describing the widget configuration)
   - `answerSchema` (Zod schema validating submitted answers)
   - `Widget` component (client component when interactivity is needed)
   - `score` function that returns an array of `{ dimension, delta }` values
2. Register the widget in `src/survey/registry.ts` by adding an entry to `widgetRegistry`.
3. Reference the widget type in the `TestDefinition` schema so JSON definitions validate end-to-end.

Widgets should avoid storing PII and instead operate on anonymized codes.
