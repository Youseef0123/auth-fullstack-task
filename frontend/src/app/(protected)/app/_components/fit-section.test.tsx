import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FitSection } from '@/app/(protected)/app/_components/fit-section';

describe('FitSection', () => {
  it('matches four Easygenerator priorities with evidence from the app', () => {
    render(<FitSection />);

    expect(
      screen.getByRole('heading', { name: 'Why Youssef × Easygenerator' }),
    ).toBeInTheDocument();
    const cards = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(cards).toHaveLength(4);
    expect(cards[0]).toHaveTextContent('NestJS, MongoDB and TypeScript');
  });

  it('links to the AI.md write-up', () => {
    render(<FitSection />);

    expect(
      screen.getByRole('link', { name: 'The full story is in AI.md' }),
    ).toHaveAttribute(
      'href',
      'https://github.com/Youseef0123/auth-fullstack-task/blob/master/AI.md',
    );
  });
});
