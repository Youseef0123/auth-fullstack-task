import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HireMeComic } from '@/app/(protected)/app/_components/hire-me-comic';

describe('HireMeComic', () => {
  it('shows the generated comic with a description and the caption', () => {
    render(<HireMeComic />);

    expect(
      screen.getByRole('img', { name: /Why hire Youssef\?/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'You help experts turn what they know into a course. So I turned what I know into one.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Generated with Gemini from my photo'),
    ).toBeInTheDocument();
  });
});
