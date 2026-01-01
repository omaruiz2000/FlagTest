import Link from 'next/link';
import { requireUser } from '@/src/auth/session';
import { isSystemAdmin } from '@/src/auth/admin';

export default async function AdminPage() {
  const user = await requireUser();
  const isAdmin = isSystemAdmin(user);

  if (!isAdmin) {
    return (
      <section>
        <h2>Admin</h2>
        <p>Not authorized.</p>
      </section>
    );
  }

  return (
    <section>
      <h2>Admin</h2>
      <p>System administration shortcuts.</p>
      <ul>
        <li>
          <Link href="/app/packages">Manage packages</Link>
        </li>
      </ul>
    </section>
  );
}
