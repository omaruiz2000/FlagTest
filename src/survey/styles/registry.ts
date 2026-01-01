'use client';

import classicStyles from './classic.module.css';

export type StyleRegistryEntry = {
  id: string;
  label: string;
  className: string;
  description?: string;
};

export const styleRegistry: Record<string, StyleRegistryEntry> = {
  classic: {
    id: 'classic',
    label: 'Classic',
    className: classicStyles.classicShell,
    description: 'Neutral layout with balanced spacing.',
  },
};

export function resolveStyle(styleId?: string) {
  if (styleId && styleRegistry[styleId]) {
    return styleRegistry[styleId];
  }
  return styleRegistry.classic;
}
