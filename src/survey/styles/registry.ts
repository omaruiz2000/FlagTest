import classic from './classic.module.css';

type RunnerStyle = typeof classic;

const styles: Record<string, RunnerStyle> = {
  classic,
};

export function resolveStyle(styleId?: string): RunnerStyle {
  return styles[styleId ?? ''] ?? classic;
}
