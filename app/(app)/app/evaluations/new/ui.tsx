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
  slug: string;
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
  const [inviteCount, setInviteCount] = useState(1);
  const [inviteLabels, setInviteLabels] = useState('');
  const [participantFeedbackMode, setParticipantFeedbackMode] = useState<'THANK_YOU_ONLY' | 'CAMOUFLAGE'>('THANK_YOU_ONLY');
  const [rosterPreview, setRosterPreview] = useState<
    { student_code: string; grade?: string; section?: string }[]
  >([]);
  const [rosterError, setRosterError] = useState<string | undefined>();

  const isSchoolPackage = selectedPackage?.slug === 'school';

  const handlePackageChange = (packageId: string) => {
    setSelectedPackageId(packageId);
    const nextPackage = packages.find((pkg) => pkg.id === packageId);
    setSelectedTests(nextPackage?.items.map((item) => item.testDefinitionId) ?? []);
    setRosterPreview([]);
    setRosterError(undefined);
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

  const handleRosterUpload = async (file: File | null) => {
    if (!file) {
      setRosterPreview([]);
      setRosterError(undefined);
      return;
    }

    try {
      const text = await file.text();
      const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      if (!lines.length) {
        throw new Error('CSV is empty');
      }

      const headers = lines[0].split(',').map((item) => item.trim().toLowerCase());
      const codeIndex = headers.indexOf('student_code');
      const gradeIndex = headers.indexOf('grade');
      const sectionIndex = headers.indexOf('section');
      const classroomIndex = headers.indexOf('classroom');

      if (codeIndex < 0) {
        throw new Error('CSV must include a student_code column');
      }

      const rows: { student_code: string; grade?: string; section?: string }[] = [];
      for (let index = 1; index < lines.length; index += 1) {
        const cells = lines[index].split(',');
        const studentCode = (cells[codeIndex] ?? '').trim();
        if (!studentCode) continue;
        const grade = gradeIndex >= 0 ? (cells[gradeIndex] ?? '').trim() : undefined;
        const sectionValue = sectionIndex >= 0 ? (cells[sectionIndex] ?? '').trim() : undefined;
        const classroomValue = classroomIndex >= 0 ? (cells[classroomIndex] ?? '').trim() : undefined;
        rows.push({ student_code: studentCode, grade: grade || undefined, section: sectionValue || classroomValue || undefined });
      }

      if (!rows.length) {
        throw new Error('No valid students found in CSV');
      }

      setRosterPreview(rows);
      setRosterError(undefined);
    } catch (err) {
      setRosterPreview([]);
      setRosterError((err as Error).message || 'Unable to read CSV');
    }
  };

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

      <label className={styles.field}>
        <span>Participant feedback</span>
        <select
          name="participantFeedbackMode"
          value={participantFeedbackMode}
          onChange={(event) => setParticipantFeedbackMode(event.target.value as 'THANK_YOU_ONLY' | 'CAMOUFLAGE')}
        >
          <option value="THANK_YOU_ONLY">THANK_YOU_ONLY (recommended for friends/couples/family)</option>
          <option value="CAMOUFLAGE">CAMOUFLAGE (recommended for kids/school)</option>
        </select>
      </label>

      {isSchoolPackage ? (
        <div className={styles.invites}>
          <div className={styles.field}>
            <span>Upload roster (CSV)</span>
            <input
              type="file"
              name="rosterFile"
              accept=".csv,text/csv"
              onChange={(event) => handleRosterUpload(event.target.files?.[0] ?? null)}
            />
            <span className={styles.helper}>
              Columns: student_code (required), grade, section, classroom. If classroom is provided and section is empty,
              classroom will be used for section.
            </span>
          </div>

          {rosterError ? <p className={styles.error}>{rosterError}</p> : null}
          {rosterPreview.length ? (
            <div className={styles.previewBox}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <strong>Preview ({rosterPreview.length} students)</strong>
                <span className={styles.helper}>Only first 5 rows shown.</span>
              </div>
              <table className={styles.previewTable}>
                <thead>
                  <tr>
                    <th>Student code</th>
                    <th>Grade</th>
                    <th>Section</th>
                  </tr>
                </thead>
                <tbody>
                  {rosterPreview.slice(0, 5).map((row) => (
                    <tr key={row.student_code}>
                      <td>{row.student_code}</td>
                      <td>{row.grade || '—'}</td>
                      <td>{row.section || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <input type="hidden" name="roster" value={rosterPreview.length ? JSON.stringify(rosterPreview) : ''} />
        </div>
      ) : (
        <div className={styles.invites}>
          <div className={styles.field}>
            <span>Number of participants (invites)</span>
            <input
              type="number"
              name="inviteCount"
              min={1}
              max={500}
              value={inviteCount}
              onChange={(event) => setInviteCount(Number(event.target.value))}
              required
            />
          </div>

          <label className={styles.field}>
            <span>Labels (one per line, optional)</span>
            <textarea
              name="inviteLabels"
              placeholder={'Pedrito\nAlexia\nStudent C'}
              value={inviteLabels}
              onChange={(event) => setInviteLabels(event.target.value)}
              rows={4}
            />
            <span className={styles.helper}>Labels will be applied in order.</span>
          </label>
        </div>
      )}

      {error ? <p className={styles.error}>{error}</p> : null}

      <button
        type="submit"
        disabled={
          pending ||
          selectedTests.length === 0 ||
          (isSchoolPackage ? rosterPreview.length === 0 || !!rosterError : false)
        }
        className={styles.submit}
      >
        {pending ? 'Creating…' : 'Create evaluation'}
      </button>
    </form>
  );
}
