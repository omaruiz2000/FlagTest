import Link from 'next/link';
import styles from '../auth.module.css';

type RegisterPageProps = {
  searchParams: { error?: string };
};

export default function RegisterPage({ searchParams }: RegisterPageProps) {
  const error = searchParams?.error;

  return (
    <div className={styles.formShell}>
      <h1>Create account</h1>
      <p>Adults only. This account will manage organizations and tests.</p>
      {error ? <div className={styles.error}>{decodeURIComponent(error)}</div> : null}
      <form className={styles.form} method="POST" action="/api/auth/register">
        <label className={styles.label}>
          Email
          <input className={styles.input} type="email" name="email" required autoComplete="email" />
        </label>
        <label className={styles.label}>
          Password
          <input className={styles.input} type="password" name="password" required autoComplete="new-password" />
        </label>
        <button className={styles.button} type="submit">
          Register
        </button>
      </form>
      <p>
        Already have access? <Link href="/auth/login">Sign in</Link>
      </p>
    </div>
  );
}
