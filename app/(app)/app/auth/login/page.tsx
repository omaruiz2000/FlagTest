import Link from 'next/link';
import styles from '../auth.module.css';

type LoginPageProps = {
  searchParams: { error?: string };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const error = searchParams?.error;

  return (
    <div className={styles.formShell}>
      <h1>Login</h1>
      <p>Access the FlagTest workspace.</p>
      {error ? <div className={styles.error}>{decodeURIComponent(error)}</div> : null}
      <form className={styles.form} method="POST" action="/api/auth/login">
        <label className={styles.label}>
          Email
          <input className={styles.input} type="email" name="email" required autoComplete="email" />
        </label>
        <label className={styles.label}>
          Password
          <input className={styles.input} type="password" name="password" required autoComplete="current-password" />
        </label>
        <button className={styles.button} type="submit">
          Sign in
        </button>
      </form>
      <p>
        Need an account? <Link href="/app/auth/register">Register</Link>
      </p>
    </div>
  );
}
