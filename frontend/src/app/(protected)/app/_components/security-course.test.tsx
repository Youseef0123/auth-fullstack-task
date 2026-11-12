import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  QUESTIONS,
  SecurityCourse,
} from '@/app/(protected)/app/_components/security-course';
import { useAuthStore } from '@/features/auth/store/auth.store';

function setup() {
  const user = userEvent.setup();
  render(<SecurityCourse />);
  return user;
}

async function answer(
  user: ReturnType<typeof userEvent.setup>,
  option: string,
) {
  await user.click(screen.getByRole('radio', { name: option }));
  await user.click(screen.getByRole('button', { name: 'Check answer' }));
}

describe('SecurityCourse', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { id: '1', email: 'jane@example.com', name: 'Jane Doe' },
      status: 'authenticated',
    });
  });

  it('only lets you check once an option is chosen', async () => {
    const user = setup();
    const check = screen.getByRole('button', { name: 'Check answer' });

    expect(check).toBeDisabled();
    await user.click(screen.getByRole('radio', { name: 'In localStorage' }));
    expect(check).toBeEnabled();
  });

  it('explains a wrong answer and locks the options', async () => {
    const user = setup();

    await answer(user, 'In localStorage');

    expect(screen.getByRole('status')).toHaveTextContent('Not quite.');
    expect(screen.getByRole('status')).toHaveTextContent(
      QUESTIONS[0].explanation,
    );
    expect(
      screen.getByRole('radio', { name: 'In an httpOnly cookie' }),
    ).toBeDisabled();
  });

  it('awards a certificate with the user name and score, and can be retaken', async () => {
    const user = setup();

    for (const [index, question] of QUESTIONS.entries()) {
      expect(
        screen.getByText(`Question ${index + 1} of ${QUESTIONS.length}`),
      ).toBeInTheDocument();
      await answer(user, question.options[question.answer]);
      expect(screen.getByRole('status')).toHaveTextContent('Correct!');
      await user.click(
        screen.getByRole('button', {
          name:
            index === QUESTIONS.length - 1
              ? 'Get my certificate'
              : 'Next question',
        }),
      );
    }

    const certificate = screen.getByRole('status');
    expect(certificate).toHaveTextContent('Certificate of completion');
    expect(certificate).toHaveTextContent('Jane Doe');
    expect(certificate).toHaveTextContent('Secure sign-in 101');
    expect(certificate).toHaveTextContent('3/3');

    await user.click(screen.getByRole('button', { name: 'Retake the course' }));
    expect(screen.getByText('Question 1 of 3')).toBeInTheDocument();
  });
});
