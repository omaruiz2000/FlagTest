import Link from 'next/link';
import { getUser } from '@/src/auth/session';
import { isPlatformAdmin } from '@/src/auth/admin';
import { AppLogoutButton } from '@/src/components/AppLogoutButton';
import styles from './layout.module.css';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  const showAdmin = isPlatformAdmin(user);

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}>FlagTest</div>
        <nav className={styles.nav}>
          <Link href="/app">Home</Link>
          <Link href="/app/evaluations">Evaluations</Link>
          {showAdmin ? <Link href="/app/admin">Admin</Link> : null}
          {user ? (
            <div className={styles.authGroup}>
              <span className={styles.userEmail}>{user.email}</span>
              <AppLogoutButton className={styles.navButton} />
            </div>
          ) : (
            <>
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
