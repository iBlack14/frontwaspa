import { SessionProvider } from 'next-auth/react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from 'sonner';
// Importamos nuestros nuevos componentes UI mejorados
import { ToastProvider } from '../components/ui/Toast';
// import MessageNotifier from '../components/MessageNotifier';
import '../src/app/globals.css';

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <>
      <Head>
        <title>Connect Blxk</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="WhatsApp management platform with enhanced UX" />
        <meta name="theme-color" content="#3B82F6" />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <SessionProvider session={session}>
        <ThemeProvider>
          <ToastProvider>
            <Component {...pageProps} />
            <Toaster position="bottom-right" richColors closeButton />
            {/* <MessageNotifier /> - Deshabilitado: requiere servidor Socket.io standalone */}
          </ToastProvider>
        </ThemeProvider>
      </SessionProvider>
    </>
  );
}
