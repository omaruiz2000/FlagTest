'use client';

import { useState } from 'react';
import styles from '../styles.module.css';

type InviteInfo = { label?: string | null; link: string };

type Props = { invites: InviteInfo[] };

export function CopyInviteLinksButton({ invites }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!invites.length) return;
    const lines = invites.map((invite, index) => {
      const fallback = `Invite #${index + 1}`;
      return `${invite.label || fallback} — ${invite.link}`;
    });
    await navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <button type="button" className={styles.secondaryButton} onClick={handleCopy} disabled={!invites.length}>
      {copied ? 'Copied!' : 'Copy all invite links'}
    </button>
  );
}
