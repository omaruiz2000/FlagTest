import Link from 'next/link';
import { getUser } from '@/src/auth/session';
import { LogoutButton } from '@/src/components/LogoutButton';
import styles from './layout.module.css';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}>FlagTest</div>
        <nav className={styles.nav}>
          {user ? (
            <>
              <Link href="/app">Home</Link>
              <LogoutButton className={styles.navButton} />
            </>
          ) : (
            <>
              <Link href="/">Home</Link>
              <Link href="/app/auth/login">Login</Link>
              <Link href="/app/auth/register">Register</Link>
            </>
          )}
        </nav>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
