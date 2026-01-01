'use client';

import { useState } from 'react';
import type { ScenarioChoiceItem, ScenarioChoiceOption } from '../schema';
import type { ScenarioChoiceAnswer } from './scenario-choice.logic';
import styles from './scenario-choice.module.css';

function OptionButton({ option, selected, onSelect }: { option: ScenarioChoiceOption; selected: boolean; onSelect: () => void }) {
  return (
    <button type="button" className={`${styles.optionButton} ${selected ? styles.active : ''}`} onClick={onSelect}>
      <div className={styles.optionLabel}>{option.label}</div>
      {option.description ? <p className={styles.optionDescription}>{option.description}</p> : null}
    </button>
  );
}

export function ScenarioChoiceWidget({ definition, onAnswer }: { definition: ScenarioChoiceItem; onAnswer?: (value: ScenarioChoiceAnswer) => void }) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (optionId: string) => {
    setSelected(optionId);
    onAnswer?.({ optionId });
  };

  return (
    <div className={styles.card}>
      <h1 className={styles.prompt}>{definition.prompt}</h1>
      {definition.scenario ? <p className={styles.scenario}>{definition.scenario}</p> : null}
      <div className={styles.options}>
        {definition.options.map((option) => (
          <OptionButton key={option.id} option={option} selected={selected === option.id} onSelect={() => handleSelect(option.id)} />
        ))}
      </div>
    </div>
  );
}
