'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export default function LoadingSpinner({
  size = 'md',
  label = 'Loading...',
}: LoadingSpinnerProps) {
  const sizeClass =
    size === 'sm'
      ? 'h-4 w-4 border-2'
      : size === 'lg'
        ? 'h-10 w-10 border-4'
        : 'h-7 w-7 border-4';

  return (
    <div
      className="flex items-center justify-center gap-3 text-[var(--color-text-muted)]"
      aria-label={label}
      role="status"
    >
      <div
        className={`${sizeClass} animate-spin rounded-full border-[var(--color-border)] border-t-[var(--color-accent)]`}
      />
      {label && <span className="text-md">{label}</span>}
    </div>
  );
}
