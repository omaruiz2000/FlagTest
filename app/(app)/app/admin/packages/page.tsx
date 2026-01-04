import Link from 'next/link';
import { requirePlatformAdmin } from '@/src/auth/admin';
import styles from '../../evaluations/styles.module.css';
import { listPackagesWithCounts } from '@/src/services/server/packages';

export const dynamic = 'force-dynamic';

export default async function AdminPackagesPage() {
  await requirePlatformAdmin();
  const packages = await listPackagesWithCounts();

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Packages</h1>
          <p className={styles.helper}>Manage packages available when creating evaluations.</p>
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
                <th>Active</th>
                <th>Tests</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg) => (
                <tr key={pkg.id}>
                  <td className={styles.monoLink}>{pkg.slug}</td>
                  <td>{pkg.title}</td>
                  <td>{pkg.isActive ? 'Yes' : 'No'}</td>
                  <td>{pkg._count.items}</td>
                  <td>
                    <Link className={styles.secondaryButton} href={`/app/admin/packages/${pkg.id}`}>
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
