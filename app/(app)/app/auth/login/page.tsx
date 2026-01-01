'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from '@/src/services/auth';
import { ApiError } from '@/src/services/http';
import styles from '../auth.module.css';

type LoginPageProps = {
  searchParams: { error?: string; returnTo?: string };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const router = useRouter();
  const search = useSearchParams();
  const returnTo = search.get('returnTo') || searchParams?.returnTo || '/app';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signIn({ email, password });
      router.push(returnTo || '/app');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'Unable to sign in');
      } else {
        setError('Unable to sign in');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.formShell}>
      <h1>Login</h1>
      <p>Access the FlagTest workspace.</p>
      {searchParams?.error ? <div className={styles.error}>{decodeURIComponent(searchParams.error)}</div> : null}
      {error ? <div className={styles.error}>{error}</div> : null}
      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.label}>
          Email
          <input
            className={styles.input}
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>
        <label className={styles.label}>
          Password
          <input
            className={styles.input}
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      <p>
        Need an account? <Link href="/app/auth/register">Register</Link>
      </p>
    </div>
  );
}
