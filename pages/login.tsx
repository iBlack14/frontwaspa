import Image from 'next/image';
import { EyeIcon, UserIcon } from '@heroicons/react/24/solid';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import wazone from '../public/logo/wallpaper-wazone.webp';
import fondo from '../public/img/fondo.webp';
import fondo_transparent from '../public/logo/wazilrest_white.png';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/utils/supabase/client';
import { Toaster, toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function Login() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();
  const { status } = useAuth();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (error) {
      toast.error(error.message || 'Credenciales incorrectas');
    } else {
      toast.success('¡Login exitoso! Redirigiendo...');
      setTimeout(() => {
        router.push('/home');
      }, 1000);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('Google Sign In Error:', error);
        toast.error(`Error: ${error.message}`);
      }
    } catch (error: any) {
      console.error('Unexpected error during Google Sign In:', error);
      toast.error('Error inesperado. Por favor, intenta nuevamente.');
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/home');
    }
  }, [status, router]);

  return (
    <div
      className="min-h-screen bg-brand-dark-950 flex items-center justify-center bg-cover bg-center relative shadow-inner shadow-black"
      style={{
        backgroundImage: `url(${fondo.src})`,
      }}
    >
      <Toaster richColors position="top-right" expand={true} closeButton />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black opacity-70"></div>

      <div className="bg-opacity-90 shadow-2xl shadow-black w-full max-w-5xl flex flex-col lg:flex-row animate-fadeIn relative z-10">
        {/* ────────────────────────────────────────────────────────
         📷 IMAGEN DE FONDO (Solo desktop)
        ──────────────────────────────────────────────────────── */}
        <div className="hidden lg:flex lg:w-3/5 w-full items-center justify-center">
          <Image
            src={wazone}
            alt="Background Logo"
            quality={100}
            priority
            className="object-cover h-full w-full lg:rounded-tl-3xl lg:rounded-bl-3xl"
          />
        </div>

        {/* ────────────────────────────────────────────────────────
         📝 FORMULARIO DE LOGIN
        ──────────────────────────────────────────────────────── */}
        <div className="lg:w-2/5 w-full p-8 backdrop-blur-xl bg-brand-surface-light rounded-b-3xl lg:rounded-bl-none lg:rounded-tr-3xl border-l border-white/10">
          {/* Logo */}
          <Image
            src={fondo_transparent}
            alt="Logo"
            height={250}
            width={250}
            quality={100}
            priority
            className="mx-auto"
          />

          {/* Título */}
          <h1 className="text-3xl font-bold text-center text-slate-100 mb-2 tracking-tight">
            Bienvenido
          </h1>
          <p className="text-center text-slate-300 text-sm mb-6">
            Inicia sesión en tu cuenta
          </p>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <Input
              id="email"
              type="email"
              label="Email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<UserIcon className="h-5 w-5" />}
              required
            />

            {/* Password Input */}
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              label="Contraseña"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              rightIcon={<EyeIcon className="h-5 w-5" />}
              onRightIconClick={() => setShowPassword((prev) => !prev)}
              required
            />

            {/* Remember me y Forgot password */}
            <div className="flex justify-between items-center">
              <label className="flex items-center text-sm text-slate-200 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mr-2 h-4 w-4 text-brand-primary-400 focus:ring-brand-primary-400 border-white/30 rounded cursor-pointer"
                />
                <span className="group-hover:text-white transition-colors">
                  Recordarme
                </span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-slate-200 hover:text-brand-primary-400 transition-colors font-medium"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Botón de submit */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
            >
              Iniciar Sesión
            </Button>
          </form>

          {/* ────────────────────────────────────────────────────────
           🔗 SEPARADOR
          ──────────────────────────────────────────────────────── */}
          <div className="flex items-center justify-center mt-6">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
            <span className="mx-4 text-slate-300 text-sm font-medium">o</span>
            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
          </div>

          {/* ────────────────────────────────────────────────────────
           🔐 LOGIN CON GOOGLE
          ──────────────────────────────────────────────────────── */}
          <div className="flex justify-center">
            <Button
              variant="secondary"
              size="md"
              onClick={handleGoogleSignIn}
              leftIcon={
                <div className="p-1 bg-white rounded-full flex items-center justify-center">
                  <Image
                    src="/img/google.webp"
                    alt="Google Logo"
                    width={24}
                    height={24}
                  />
                </div>
              }
            >
              Continuar con Google
            </Button>
          </div>

          {/* ────────────────────────────────────────────────────────
           📝 REGISTRO
          ──────────────────────────────────────────────────────── */}
          <p className="text-center text-sm text-slate-300 mt-6">
            ¿No tienes una cuenta?{' '}
            <Link
              href="/register"
              className="text-brand-primary-400 hover:text-brand-primary-300 font-bold hover:underline transition-colors"
            >
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// Force SSR to avoid static generation errors
export async function getServerSideProps() {
  return { props: {} };
}
