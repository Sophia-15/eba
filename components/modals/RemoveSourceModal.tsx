'use client';

import type { StoredSource } from '@/types/storage';

interface RemoveSourceModalProps {
  source: StoredSource;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}

export default function RemoveSourceModal({
  source,
  onCancel,
  onConfirm,
}: RemoveSourceModalProps) {
  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
        role="dialog"
        aria-modal="true"
      >
        <h3 className="mb-2 text-lg font-semibold">Remove source?</h3>
        <p className="mb-4 text-md text-[var(--color-text-muted)]">
          This will remove <strong>{source.name}</strong> from your library.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-md"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg bg-red-500 px-4 py-2 text-md font-semibold text-white"
            onClick={() => void onConfirm()}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
