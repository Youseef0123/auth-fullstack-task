import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PasswordInput } from '@/features/auth/components/password-input';

describe('PasswordInput', () => {
  it('toggles visibility with an accessible pressed-state button', async () => {
    const user = userEvent.setup();
    render(
      <>
        <label htmlFor="pw">Password</label>
        <PasswordInput id="pw" />
      </>,
    );
    const input = screen.getByLabelText('Password');
    const toggle = screen.getByRole('button', { name: 'Show password' });

    expect(input).toHaveAttribute('type', 'password');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(toggle).toHaveAttribute('aria-controls', 'pw');

    await user.click(toggle);
    expect(input).toHaveAttribute('type', 'text');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');

    await user.click(toggle);
    expect(input).toHaveAttribute('type', 'password');
  });
});
