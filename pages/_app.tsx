import type { AppProps } from 'next/app';
import Head from 'next/head';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'sonner';
// import MessageNotifier from '../components/MessageNotifier';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Connect Blxk</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <AuthProvider>
        <ThemeProvider>
          <Component {...pageProps} />
          <Toaster position="bottom-right" richColors closeButton />
          {/* <MessageNotifier /> - Deshabilitado: requiere servidor Socket.io standalone */}
        </ThemeProvider>
      </AuthProvider>
    </>
  );
}
