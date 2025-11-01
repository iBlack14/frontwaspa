import { SessionProvider } from 'next-auth/react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from 'sonner';
// import MessageNotifier from '../components/MessageNotifier'; // Deshabilitado temporalmente - requiere servidor Socket.io
import '../src/app/globals.css';

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <>
      <Head>
        <title>Connect Blxk</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <SessionProvider session={session}>
        <ThemeProvider>
          <Component {...pageProps} />
          <Toaster position="bottom-right" richColors closeButton />
          {/* <MessageNotifier /> */}
        </ThemeProvider>
      </SessionProvider>
    </>
  );
}
