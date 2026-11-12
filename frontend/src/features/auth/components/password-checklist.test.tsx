import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PasswordChecklist } from '@/features/auth/components/password-checklist';

describe('PasswordChecklist strength meter', () => {
  it('stays hidden until something is typed', () => {
    render(<PasswordChecklist password="" />);

    expect(screen.queryByText(/password strength/i)).not.toBeInTheDocument();
  });

  it.each([
    ['!', 'Weak'],
    ['abc', 'Weak'],
    ['abc1', 'Fair'],
    ['abc1!', 'Good'],
    ['abcdef1!', 'Strong'],
  ])('labels %p as %s (text, not colour alone)', (password, label) => {
    render(<PasswordChecklist password={password} />);

    expect(
      screen.getByText(/password strength/i).parentElement,
    ).toHaveTextContent(`Password strength: ${label}`);
  });
});
