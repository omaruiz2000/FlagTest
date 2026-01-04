import Link from 'next/link';
import { requirePlatformAdmin } from '@/src/auth/admin';

export default async function AdminPage() {
  await requirePlatformAdmin();

  return (
    <section>
      <h2>Admin</h2>
      <p>System administration shortcuts.</p>
      <ul>
        <li>
          <Link href="/app/admin/packages">Manage packages</Link>
        </li>
        <li>
          <Link href="/app/admin/evaluations">Evaluations</Link>
        </li>
        <li>
          <Link href="/app/admin/camouflage">Camouflage sets</Link>
        </li>
        <li>
          <Link href="/app/admin/tests">Test configuration</Link>
        </li>
      </ul>
    </section>
  );
}
