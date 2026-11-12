import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { comicFont } from '@/lib/fonts';
import { AUTHOR_NAME, COMPANY_NAME } from '@/lib/site';

interface CourseCertificateProps {
  name: string;
  course: string;
  score: number;
  total: number;
  onRetake: () => void;
}

export function CourseCertificate({
  name,
  course,
  score,
  total,
  onRetake,
}: CourseCertificateProps) {
  const issuedOn = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="motion-safe:animate-fade-up">
      <div
        role="status"
        className="relative overflow-hidden rounded-2xl bg-linear-to-br from-amber-100 via-white to-violet-100 p-1.5 text-ink shadow-xl dark:from-amber-200 dark:to-violet-200"
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
            Certificate of completion
          </p>
          <p className="mt-4 text-sm text-zinc-600">This certifies that</p>
          <p className="mt-1 text-2xl font-semibold sm:text-3xl">{name}</p>
          <p className="mt-3 text-sm text-zinc-600">
            completed <span className="font-semibold text-ink">{course}</span>{' '}
            with a score of{' '}
            <span className="font-semibold text-ink">
              {score}/{total}
            </span>
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-1 text-xs text-zinc-500 sm:flex-row sm:gap-4">
            <span>Issued {issuedOn}</span>
            <span aria-hidden="true" className="hidden sm:inline">
              ·
            </span>
            <span>
              Course by {AUTHOR_NAME}, built for the {COMPANY_NAME} team
            </span>
          </div>
        </div>
      </div>
      <div className="mt-4 flex justify-center">
        <Button variant="secondary" onClick={onRetake}>
          Retake the course
        </Button>
      </div>
    </div>
  );
}
