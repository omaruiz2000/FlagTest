# Widgets

Each widget defines how a test item is rendered, validated, and scored.

To add a widget:
1. Split logic and rendering:
   - Logic-only module (e.g., `widget-name.logic.ts`) that exports `definitionSchema`, `answerSchema`, and a `score` function.
   - Client renderer (e.g., `widget-name.client.tsx`) that renders the UI and calls `onAnswer`.
2. Register logic in `src/survey/registry.server.ts` and the renderer in `src/survey/registry.client.ts`.
3. Reference the widget type in the `TestDefinition` schema so JSON definitions validate end-to-end.

Widgets should avoid storing PII and instead operate on anonymized codes.
