import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { comicFont } from '@/lib/fonts';

interface CertificateProps {
  title: string;
  name: string;
  /** The achievement sentence, e.g. what the user did to earn it. */
  children: ReactNode;
  footnote: string;
  restartLabel: string;
  onRestart: () => void;
}

export function Certificate({
  title,
  name,
  children,
  footnote,
  restartLabel,
  onRestart,
}: CertificateProps) {
  const issuedOn = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="motion-safe:animate-fade-up">
      <div
        role="status"
        className="relative overflow-hidden rounded-2xl bg-linear-to-br from-amber-100 via-white to-violet-100 p-1.5 text-ink shadow-xl"
      >
        <div className="rounded-xl border-2 border-dashed border-amber-500/60 px-6 py-8 text-center sm:px-10">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-linear-to-br from-amber-300 to-amber-500 text-ink shadow-md ring-4 ring-amber-200">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-8"
            >
              <path d="m12 2.5 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.3l-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9Z" />
            </svg>
          </span>
          <p
            className={cn(
              comicFont.className,
              'mt-4 text-3xl tracking-wide text-violet-700 sm:text-4xl',
            )}
          >
            {title}
          </p>
          <p className="mt-4 text-sm text-zinc-600">This certifies that</p>
          <p className="mt-1 text-2xl font-semibold sm:text-3xl">{name}</p>
          <p className="mx-auto mt-3 max-w-md text-sm text-zinc-600">
            {children}
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-1 text-xs text-zinc-500 sm:flex-row sm:gap-4">
            <span>Issued {issuedOn}</span>
            <span aria-hidden="true" className="hidden sm:inline">
              ·
            </span>
            <span>{footnote}</span>
          </div>
        </div>
      </div>
      <div className="mt-4 flex justify-center">
        <Button variant="secondary" onClick={onRestart}>
          {restartLabel}
        </Button>
      </div>
    </div>
  );
}
