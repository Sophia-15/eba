'use client';

import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
      {icon ? <span className="mb-3 text-3xl">{icon}</span> : null}
      <h3 className="mb-2 text-xl font-semibold text-[var(--color-text)]">
        {title}
      </h3>
      {description && (
        <p className="mb-5 text-md text-[var(--color-text-muted)]">
          {description}
        </p>
      )}
      {action && (
        <button
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-md font-semibold text-white transition hover:brightness-110"
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
