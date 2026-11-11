import type { ReactNode } from 'react';

interface AlertProps {
  children: ReactNode;
}

/** Error message announced to screen readers as soon as it appears. */
export function Alert({ children }: AlertProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-lg border border-danger-border bg-danger-soft px-3.5 py-3 text-sm text-danger"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="mt-px size-4 shrink-0"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
          clipRule="evenodd"
        />
      </svg>
      <div>{children}</div>
    </div>
  );
}
