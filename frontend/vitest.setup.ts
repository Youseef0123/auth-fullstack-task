import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// next/font loaders are compiled by Next.js; under Vitest they are plain stubs.
vi.mock('next/font/google', () => {
  const font = () => ({ className: '', style: { fontFamily: 'sans-serif' } });
  return { Bangers: font, Geist: font };
});

afterEach(() => {
  cleanup();
});
