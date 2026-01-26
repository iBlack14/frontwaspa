import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User, Session } from '@supabase/supabase-js';

type AuthContextType = {
    user: User | null;
    session: any;
    status: 'loading' | 'authenticated' | 'unauthenticated';
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [sessionData, setSessionData] = useState<any>(null);
    const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
    const supabase = createClient();

    useEffect(() => {
        const handleAuthChange = (currentSession: Session | null) => {
            if (currentSession) {
                setSessionData({
                    user: {
                        id: currentSession.user.id,
                        email: currentSession.user.email,
                        name: currentSession.user.user_metadata?.username || currentSession.user.user_metadata?.full_name,
                        image: currentSession.user.user_metadata?.avatar_url,
                    },
                    id: currentSession.user.id,
                    username: currentSession.user.user_metadata?.username || currentSession.user.user_metadata?.full_name,
                    expires: currentSession.expires_at ? new Date(currentSession.expires_at * 1000).toISOString() : '',
                });
                setUser(currentSession.user);
                setStatus('authenticated');
            } else {
                setSessionData(null);
                setUser(null);
                setStatus('unauthenticated');
            }
        };

        const getInitialSession = async () => {
            try {
                const { data: { session: initialSession } } = await supabase.auth.getSession();
                handleAuthChange(initialSession);
            } catch (error) {
                console.error('Error getting initial session:', error);
                setStatus('unauthenticated');
            }
        };

        getInitialSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
            handleAuthChange(currentSession);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, session: sessionData, status, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
