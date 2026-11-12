import Image from 'next/image';
import { cn } from '@/lib/cn';
import { comicFont } from '@/lib/fonts';
import { COMPANY_NAME } from '@/lib/site';

/** The AI-generated comic: the author's "course about himself", built the Easygenerator way. */
export function HireMeComic() {
  return (
    <section aria-labelledby="comic-title">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2
          id="comic-title"
          className={cn(
            comicFont.className,
            'text-4xl tracking-wide sm:text-5xl',
          )}
        >
          A course about me,{' '}
          <span className="bg-linear-to-r from-brand-indigo via-brand-violet to-brand-fuchsia bg-clip-text text-transparent">
            the {COMPANY_NAME} way
          </span>
        </h2>
        <p className="text-sm text-muted-foreground">
          Generated with Gemini from my photo
        </p>
      </div>

      <figure className="mt-6 overflow-hidden rounded-3xl border-[3px] border-ink bg-violet-100 shadow-[8px_8px_0_rgb(124_58_237/0.35)]">
        <Image
          src="/images/why-hire-youssef.jpg"
          alt="Comic: Youssef sips coffee at his laptop while a small AI robot builds an online course titled 'Why hire Youssef?' from lesson, video, quiz and certificate blocks. The quiz answer 'Obviously yes' is ticked, colleagues cheer with a certificate, and a second robot staggers under a giant padlocked cookie labelled httpOnly."
          width={1264}
          height={848}
          sizes="(min-width: 1024px) 64rem, 100vw"
          priority
          className="h-auto w-full"
        />
        <figcaption
          className={cn(
            comicFont.className,
            'border-t-[3px] border-ink bg-amber-300 px-5 py-3 text-center text-lg tracking-wide text-ink sm:text-2xl',
          )}
        >
          You help experts turn what they know into a course. So I turned what I
          know into one.
        </figcaption>
      </figure>
    </section>
  );
}
