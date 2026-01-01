import { ScenarioChoiceWidget } from '@/src/survey/widgets/scenario-choice.client';
import { resolveStyle } from '@/src/survey/styles/registry';
import { ScenarioChoiceItem } from '@/src/survey/schema';

const exampleItem: ScenarioChoiceItem = {
  id: 'demo-scenario',
  widgetType: 'scenario_choice',
  prompt: 'Try the scenario choice widget',
  scenario: 'Imagine you and a friend are deciding how to start a project.',
  options: [
    { id: 'a', label: 'Plan together', description: 'Talk through the plan before acting.' },
    { id: 'b', label: 'Experiment', description: 'Prototype quickly and adjust as you go.' },
  ],
  scoring: [
    { dimension: 'collaboration', delta: 1 },
  ],
};

export default function RunnerHomePage() {
  const style = resolveStyle('classic');

  return (
    <div className={style.classicShell}>
      <ScenarioChoiceWidget definition={exampleItem} />
    </div>
  );
}
