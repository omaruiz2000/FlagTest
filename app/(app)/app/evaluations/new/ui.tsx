'use client';

import { useMemo, useState } from 'react';
import styles from '../styles.module.css';

type PackageItem = {
  id: string;
  testDefinitionId: string;
  sortOrder: number;
  testDefinition: {
    id: string;
    title: string;
    description: string | null;
  };
};

type Package = {
  id: string;
  title: string;
  description: string | null;
  items: PackageItem[];
};

type FormState = { error?: string } | undefined;

type Props = {
  packages: Package[];
  action: (formData: FormData) => Promise<FormState>;
};

export function EvaluationBuilderForm({ packages, action }: Props) {
  const [selectedPackageId, setSelectedPackageId] = useState(packages[0]?.id);
  const [selectedTests, setSelectedTests] = useState<string[]>(() =>
    packages[0]?.items.map((item) => item.testDefinitionId) ?? [],
  );
  const [pending, setPending] = useState(false);
  const selectedPackage = useMemo(() => packages.find((pkg) => pkg.id === selectedPackageId), [packages, selectedPackageId]);
  const [error, setError] = useState<string | undefined>();
  const [createInvites, setCreateInvites] = useState(false);
  const [inviteCount, setInviteCount] = useState(3);
  const [inviteLabels, setInviteLabels] = useState('');

  const handlePackageChange = (packageId: string) => {
    setSelectedPackageId(packageId);
    const nextPackage = packages.find((pkg) => pkg.id === packageId);
    setSelectedTests(nextPackage?.items.map((item) => item.testDefinitionId) ?? []);
  };

  const handleToggle = (testId: string, checked: boolean) => {
    setSelectedTests((current) => {
      if (checked) {
        return Array.from(new Set([...current, testId]));
      }
      return current.filter((id) => id !== testId);
    });
  };

  const handleSubmit = async (formData: FormData) => {
    setPending(true);
    setError(undefined);
    const result = await action(formData);
    if (result?.error) {
      setError(result.error);
    }
    setPending(false);
  };

  if (!packages.length) {
    return <p className={styles.empty}>No packages are available yet.</p>;
  }

  return (
    <form action={handleSubmit} className={styles.card}>
      <label className={styles.field}>
        <span>Evaluation name</span>
        <input name="name" type="text" required placeholder="Mid-year check" />
      </label>

      <label className={styles.field}>
        <span>Package</span>
        <select
          name="packageId"
          value={selectedPackageId}
          onChange={(event) => handlePackageChange(event.target.value)}
          required
        >
          {packages.map((pkg) => (
            <option key={pkg.id} value={pkg.id}>
              {pkg.title}
            </option>
          ))}
        </select>
      </label>

      <div className={styles.tests}>
        <div className={styles.testsHeader}>
          <span>Tests in package</span>
          <span className={styles.helper}>Select at least one</span>
        </div>
        <div className={styles.testList}>
          {selectedPackage?.items.map((item) => {
            const checked = selectedTests.includes(item.testDefinitionId);
            return (
              <label key={item.id} className={styles.testRow}>
                <input
                  type="checkbox"
                  name="tests"
                  value={item.testDefinitionId}
                  checked={checked}
                  onChange={(event) => handleToggle(item.testDefinitionId, event.target.checked)}
                />
                <div>
                  <div className={styles.testTitle}>{item.testDefinition.title}</div>
                  {item.testDefinition.description ? (
                    <p className={styles.testDescription}>{item.testDefinition.description}</p>
                  ) : null}
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <div className={styles.invites}>
        <label className={styles.fieldCheckbox}>
          <input
            type="checkbox"
            name="createInvites"
            checked={createInvites}
            onChange={(event) => setCreateInvites(event.target.checked)}
          />
          <div>
            <div className={styles.testTitle}>Participants (Invites)</div>
            <p className={styles.testDescription}>
              Create unique invite links for participants and optionally add labels.
            </p>
          </div>
        </label>

        <div className={styles.inviteFields} aria-hidden={!createInvites}>
          <label className={styles.field}>
            <span>Number of participants</span>
            <input
              type="number"
              name="inviteCount"
              min={1}
              max={500}
              value={inviteCount}
              onChange={(event) => setInviteCount(Number(event.target.value))}
              disabled={!createInvites}
              required={createInvites}
            />
          </label>

          <label className={styles.field}>
            <span>Labels (one per line, optional)</span>
            <textarea
              name="inviteLabels"
              placeholder={'Pedrito\nAlexia\nStudent C'}
              value={inviteLabels}
              onChange={(event) => setInviteLabels(event.target.value)}
              disabled={!createInvites}
              rows={4}
            />
            <span className={styles.helper}>Labels will be applied in order.</span>
          </label>
        </div>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      <button type="submit" disabled={pending || selectedTests.length === 0} className={styles.submit}>
        {pending ? 'Creating…' : 'Create evaluation'}
      </button>
    </form>
  );
}
