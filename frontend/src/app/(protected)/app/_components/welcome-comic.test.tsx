import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { WelcomeComic } from '@/app/(protected)/app/_components/welcome-comic';
import { useAuthStore } from '@/features/auth/store/auth.store';

describe('WelcomeComic', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { id: '1', email: 'jane@example.com', name: 'Jane van Doe' },
      status: 'authenticated',
    });
  });

  it('tells the story in four panels with readable captions and bubbles', () => {
    render(<WelcomeComic />);

    const panels = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(panels).toHaveLength(4);
    expect(panels[0]).toHaveTextContent('Meet Sam, the expert');
    expect(panels[1]).toHaveTextContent('Sam opens Easygenerator');
  });

  it('greets the signed-in user by first name and credits the author in the last panel', () => {
    render(<WelcomeComic />);

    const lastPanel = within(screen.getByRole('list')).getAllByRole(
      'listitem',
    )[3];
    expect(lastPanel).toHaveTextContent(
      "I'm Youssef. I built the secure way in. Welcome, Jane!",
    );
  });
});
