import Link from 'next/link';
import styles from './layout.module.css';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}>FlagTest</div>
        <nav className={styles.nav}>
          <Link href="/app">Home</Link>
          <Link href="/app/auth/login">Login</Link>
          <Link href="/app/auth/register">Register</Link>
        </nav>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
