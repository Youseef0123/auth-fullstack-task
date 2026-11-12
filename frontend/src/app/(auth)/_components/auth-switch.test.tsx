import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthShowcase } from '@/app/(auth)/_components/auth-showcase';
import { AuthSwitch } from '@/app/(auth)/_components/auth-switch';

const { navigation } = vi.hoisted(() => ({
  navigation: { pathname: '/signin' },
}));
vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
}));

describe('auth layout pieces', () => {
  it.each([
    ['/signin', 'Sign in', 'Sign up'],
    ['/signup', 'Sign up', 'Sign in'],
  ])('on %s marks %s as the current page', (pathname, current, other) => {
    navigation.pathname = pathname;
    render(<AuthSwitch />);

    expect(screen.getByRole('link', { name: current })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: other })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('links the two auth pages to each other', () => {
    navigation.pathname = '/signin';
    render(<AuthSwitch />);

    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/signin',
    );
    expect(screen.getByRole('link', { name: 'Sign up' })).toHaveAttribute(
      'href',
      '/signup',
    );
  });

  it.each([
    ['/signin', 'ready to share.'],
    ['/signup', 'worth sharing.'],
  ])('shows page-specific showcase copy on %s', (pathname, highlight) => {
    navigation.pathname = pathname;
    render(<AuthShowcase />);

    expect(screen.getByText(highlight)).toBeInTheDocument();
    expect(
      screen.getByText('Crafted by Youssef for the Easygenerator team'),
    ).toBeInTheDocument();
  });
});
