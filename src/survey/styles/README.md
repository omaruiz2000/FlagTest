# Styles

Styles allow the runner to swap visual treatments without changing widget logic.

To add a style:
1. Create a CSS Module in this directory.
2. Add an entry to `styleRegistry` in `src/survey/registry.ts` with an `id`, `label`, and `className` exported from the CSS Module.
3. The runner can choose the style by setting `styleId` on the `TestDefinition` JSON.
