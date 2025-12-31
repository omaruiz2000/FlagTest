import styles from './layout.module.css';

export default function RunnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.runnerShell}>{children}</div>
  );
}
