'use client';

import { useState } from 'react';
import { CourseCertificate } from '@/app/(protected)/app/_components/course-certificate';
import { Button } from '@/components/ui/button';
import { ARROW_RIGHT_ICON } from '@/components/ui/input-icons';
import { selectUser, useAuthStore } from '@/features/auth/store/auth.store';
import { cn } from '@/lib/cn';

interface Question {
  prompt: string;
  options: readonly string[];
  answer: number;
  explanation: string;
}

export const COURSE_TITLE = 'Secure sign-in 101';

/** Three questions about how this very app protects the session you are using. */
export const QUESTIONS: readonly Question[] = [
  {
    prompt: 'Where does your session token live in this app?',
    options: [
      'In localStorage',
      'In the Zustand store',
      'In an httpOnly cookie',
    ],
    answer: 2,
    explanation:
      'JavaScript cannot read an httpOnly cookie, so a script injected into the page cannot steal your session.',
  },
  {
    prompt: 'How is your password stored?',
    options: [
      'Hashed with argon2id',
      'Encrypted, so it can be decrypted later',
      'As plain text in a private database',
    ],
    answer: 0,
    explanation:
      'argon2id is a slow, memory-hard hash: even with a copy of the database, the password cannot be read back.',
  },
  {
    prompt: 'You mistype your password six times in one minute. What happens?',
    options: [
      'The account is locked forever',
      '"Too many attempts": wait a minute and try again',
      'Nothing, you can keep guessing',
    ],
    answer: 1,
    explanation:
      'Sign-in allows 5 attempts per minute per client, and the edge proxy sets the client address, so changing headers does not reset the count.',
  },
];

/** A two-minute, Easygenerator-style mini-course: quiz with feedback, then a certificate. */
export function SecurityCourse() {
  const user = useAuthStore(selectUser);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const question = QUESTIONS[index];
  const isLast = index === QUESTIONS.length - 1;
  const isCorrect = selected === question.answer;
  const progress = ((index + (checked ? 1 : 0)) / QUESTIONS.length) * 100;

  function check(): void {
    setChecked(true);
    if (isCorrect) {
      setScore((value) => value + 1);
    }
  }

  function next(): void {
    if (isLast) {
      setFinished(true);
      return;
    }
    setIndex((value) => value + 1);
    setSelected(null);
    setChecked(false);
  }

  function retake(): void {
    setIndex(0);
    setSelected(null);
    setChecked(false);
    setScore(0);
    setFinished(false);
  }

  return (
    <section
      aria-labelledby="course-title"
      className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Mini-course · 2 minutes
          </p>
          <h2
            id="course-title"
            className="mt-1 text-2xl font-semibold tracking-tight"
          >
            {COURSE_TITLE}
          </h2>
        </div>
        {!finished && (
          <p className="text-sm text-muted-foreground">
            Question {index + 1} of {QUESTIONS.length}
          </p>
        )}
      </div>

      <div
        aria-hidden="true"
        className="mt-5 h-2 overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-linear-to-r from-brand-indigo via-brand-violet to-brand-fuchsia transition-[width] duration-500"
          style={{ width: `${finished ? 100 : progress}%` }}
        />
      </div>

      <div className="mt-6">
        {finished ? (
          <CourseCertificate
            name={user?.name ?? 'You'}
            course={COURSE_TITLE}
            score={score}
            total={QUESTIONS.length}
            onRetake={retake}
          />
        ) : (
          <fieldset key={index} className="motion-safe:animate-fade-up">
            <legend className="text-lg font-semibold">{question.prompt}</legend>
            <div className="mt-4 grid gap-2.5">
              {question.options.map((option, optionIndex) => {
                const isAnswer = optionIndex === question.answer;
                const isChosen = optionIndex === selected;
                return (
                  <label
                    key={option}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors',
                      !checked && 'hover:border-ring hover:bg-muted/60',
                      !checked && isChosen && 'border-ring bg-primary-soft',
                      !checked && !isChosen && 'border-border',
                      checked && isAnswer && 'border-success bg-success/10',
                      checked &&
                        isChosen &&
                        !isAnswer &&
                        'border-danger bg-danger-soft',
                      checked &&
                        !isAnswer &&
                        !isChosen &&
                        'border-border opacity-60',
                      checked && 'cursor-default',
                    )}
                  >
                    <input
                      type="radio"
                      name={`question-${index}`}
                      value={optionIndex}
                      checked={isChosen}
                      disabled={checked}
                      onChange={() => setSelected(optionIndex)}
                      className="size-4 accent-brand-violet"
                    />
                    <span className="flex-1">{option}</span>
                  </label>
                );
              })}
            </div>

            {checked && (
              <div
                role="status"
                className={cn(
                  'mt-4 rounded-xl px-4 py-3 text-sm',
                  isCorrect
                    ? 'bg-success/10 text-success'
                    : 'bg-danger-soft text-danger',
                )}
              >
                <p className="font-semibold">
                  {isCorrect ? 'Correct!' : 'Not quite.'}
                </p>
                <p className="mt-1 text-foreground">{question.explanation}</p>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              {checked ? (
                <Button onClick={next}>
                  {isLast ? 'Get my certificate' : 'Next question'}
                  {ARROW_RIGHT_ICON}
                </Button>
              ) : (
                <Button onClick={check} disabled={selected === null}>
                  Check answer
                </Button>
              )}
            </div>
          </fieldset>
        )}
      </div>
    </section>
  );
}
