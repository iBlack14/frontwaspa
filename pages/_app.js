import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'sonner';
import MessageNotifier from '@/components/MessageNotifier';
import '@/styles/globals.css';

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
      <Toaster position="bottom-right" richColors closeButton />
      <MessageNotifier />
    </SessionProvider>
  );
}
