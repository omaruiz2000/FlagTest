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
  slug?: string;
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
  const [rosterJson, setRosterJson] = useState('');
  const [rosterAccepted, setRosterAccepted] = useState(false);
  const [rosterSummary, setRosterSummary] = useState<{ valid: number; duplicates: number; invalid: number } | null>(null);
  const selectedPackageSlug = selectedPackage?.slug;
  const isSchoolBundle = selectedPackageSlug === 'school-bundle';

  const handlePackageChange = (packageId: string) => {
    setSelectedPackageId(packageId);
    const nextPackage = packages.find((pkg) => pkg.id === packageId);
    setSelectedTests(nextPackage?.items.map((item) => item.testDefinitionId) ?? []);
    setRosterAccepted(false);
    setRosterJson('');
    setRosterSummary(null);
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
    if (isSchoolBundle && !rosterAccepted) {
      setError('Upload and accept a roster to continue');
      return;
    }
    setPending(true);
    setError(undefined);
    if (rosterAccepted && rosterJson) {
      formData.set('roster', rosterJson);
    }
    const result = await action(formData);
    if (result?.error) {
      setError(result.error);
    }
    setPending(false);
  };

  if (!packages.length) {
    return <p className={styles.empty}>No packages are available yet.</p>;
  }

  const handleRosterFile = async (file: File | null) => {
    if (!file) {
      setRosterAccepted(false);
      setRosterJson('');
      setRosterSummary(null);
      return;
    }

    const text = await file.text();
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (!lines.length) {
      setError('CSV is empty');
      setRosterAccepted(false);
      setRosterSummary(null);
      return;
    }

    const parseLine = (line: string) => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i += 1) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i += 1;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const header = parseLine(lines[0]).map((value) => value.toLowerCase());
    const codeIndex = header.indexOf('student_code');
    const gradeIndex = header.indexOf('grade');
    const sectionIndex = header.indexOf('section');
    const classroomIndex = header.indexOf('classroom');

    if (codeIndex === -1) {
      setError('CSV must include a student_code column');
      setRosterAccepted(false);
      setRosterSummary(null);
      return;
    }

    const seen = new Set<string>();
    const rows: { code: string; grade?: string; section?: string; metadata?: Record<string, string> }[] = [];
    let duplicates = 0;
    let invalid = 0;

    lines.slice(1).forEach((line) => {
      const values = parseLine(line);
      const code = values[codeIndex]?.trim();
      const grade = gradeIndex >= 0 ? values[gradeIndex]?.trim() : '';
      const sectionRaw = sectionIndex >= 0 ? values[sectionIndex]?.trim() : '';
      const classroom = classroomIndex >= 0 ? values[classroomIndex]?.trim() : '';
      const section = sectionRaw || classroom;
      if (!code) {
        invalid += 1;
        return;
      }
      if (seen.has(code)) {
        duplicates += 1;
        return;
      }
      seen.add(code);
      const metadata = classroom ? { classroom } : undefined;
      rows.push({ code, grade: grade || undefined, section: section || undefined, metadata });
    });

    if (!rows.length) {
      setError('No valid roster entries found');
      setRosterAccepted(false);
      setRosterSummary({ valid: 0, duplicates, invalid });
      return;
    }

    setRosterJson(JSON.stringify(rows));
    setRosterSummary({ valid: rows.length, duplicates, invalid });
    setRosterAccepted(true);
    setError(undefined);
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

      {isSchoolBundle ? (
        <div className={styles.invites}>
          <div className={styles.field}>
            <span>School roster (CSV upload)</span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => handleRosterFile(event.target.files?.[0] ?? null)}
              required
            />
            <span className={styles.helper}>
              CSV columns: student_code (required), grade, section, classroom. If section is empty, classroom will be used.
            </span>
          </div>
          {rosterSummary ? (
            <div className={styles.field}>
              <span>Roster preview</span>
              <div className={styles.helper}>
                Valid: {rosterSummary.valid} · Duplicates skipped: {rosterSummary.duplicates} · Invalid rows: {rosterSummary.invalid}
              </div>
              {!rosterAccepted ? (
                <div className={styles.helper} style={{ color: '#b91c1c' }}>
                  Fix the CSV to continue.
                </div>
              ) : null}
            </div>
          ) : null}
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
        disabled={pending || selectedTests.length === 0 || (isSchoolBundle && !rosterAccepted)}
        className={styles.submit}
      >
        {pending ? 'Creating…' : 'Create evaluation'}
      </button>
    </form>
  );
}
