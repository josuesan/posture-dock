import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';
import { messages } from '@/translations';

export const metadata: Metadata = {
  title: messages.metadata.title,
  description: messages.metadata.description
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang={messages.locale}>
      <body>{children}</body>
    </html>
  );
}
