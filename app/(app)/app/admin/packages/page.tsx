import Link from 'next/link';
import { requireUser } from '@/src/auth/session';
import { isPlatformAdmin } from '@/src/auth/admin';
import { listCorePackagesWithItems } from '@/src/db/repositories/testPackages';
import styles from '../../evaluations/styles.module.css';

export const dynamic = 'force-dynamic';

export default async function AdminPackagesPage() {
  const user = await requireUser();
  const isAdmin = isPlatformAdmin(user);

  if (!isAdmin) {
    return <p>Not authorized</p>;
  }

  const packages = await listCorePackagesWithItems();

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Packages</h1>
          <p className={styles.helper}>Manage the built-in packages and their test assignments.</p>
        </div>
        <Link className={styles.secondaryButton} href="/app/admin">
          Back to admin
        </Link>
      </div>

      <div className={styles.card}>
        {packages.length ? (
          <table className={styles.inviteTable}>
            <thead>
              <tr>
                <th>Slug</th>
                <th>Title</th>
                <th>Tests</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg) => (
                <tr key={pkg.id}>
                  <td>{pkg.slug}</td>
                  <td>{pkg.title}</td>
                  <td>{pkg.items.length}</td>
                  <td>
                    <Link className={styles.secondaryButton} href={`/app/admin/packages/${pkg.slug}`}>
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className={styles.helper}>No packages found.</p>
        )}
      </div>
    </section>
  );
}
