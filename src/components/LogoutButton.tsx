'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signOut } from '@/src/services/auth';

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await signOut();
    } catch (error) {
      // Swallow errors and continue to redirect to login.
    } finally {
      router.push('/app/auth/login');
      setLoading(false);
    }
  };

  return (
    <button type="button" className={className} onClick={handleClick} disabled={loading}>
      {loading ? 'Logging out...' : 'Logout'}
    </button>
  );
}
