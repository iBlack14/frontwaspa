import { SessionProvider } from 'next-auth/react';
import type { AppProps } from 'next/app';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from 'sonner';
import MessageNotifier from '../components/MessageNotifier';
import '../src/app/globals.css';

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider>
        <Component {...pageProps} />
        <Toaster position="bottom-right" richColors closeButton />
        <MessageNotifier />
      </ThemeProvider>
    </SessionProvider>
  );
}
