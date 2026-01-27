import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@/utils/supabase/client';

export default function AuthCallback() {
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                router.push('/home');
            } else if (event === 'SIGNED_OUT') {
                router.push('/login');
            }
        });

        // También intentar obtener la sesión actual por si ya se procesó
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                router.push('/home');
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [router, supabase.auth]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-950">
            <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
                <p className="text-slate-300 animate-pulse">Finalizando inicio de sesión...</p>
            </div>
        </div>
    );
}


// Force SSR to avoid static generation errors
export async function getServerSideProps() {
  return { props: {} };
}
