import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import LandingPage from '../components/landing/LandingPage';

export default function Home() {
  const { session, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Si el usuario ya está autenticado, redirigir al dashboard
    if (status === 'authenticated') {
      router.push('/home');
    }
  }, [status, router]);

  // No bloqueamos con 'loading' porque puede causar parpadeos o problemas en iframes
  // LandingPage se mostrará por defecto y si se confirma la sesión, el useEffect redirige.

  return <LandingPage />;
}


// Force SSR to avoid static generation errors
export async function getServerSideProps() {
  return { props: {} };
}
