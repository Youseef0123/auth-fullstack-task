import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import { APP_NAME } from '@/lib/site';
import { THEME_INIT_SCRIPT } from '@/lib/theme';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: 'Create an account or sign in securely.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f7f9' },
    { media: '(prefers-color-scheme: dark)', color: '#0c0c10' },
  ],
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    // data-theme is set by THEME_INIT_SCRIPT before hydration, hence suppressHydrationWarning.
    <html lang="en" className={geistSans.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
