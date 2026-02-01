import { useEffect, useState } from 'react';
import { XMarkIcon, CheckIcon, ShieldCheckIcon, LockClosedIcon, CreditCardIcon, ArrowLeftIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface IzipayModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: {
    name: string;
    price: number;
    period: string;
  };
  userEmail?: string;
}

declare global {
  interface Window {
    KR: any;
  }
}

const steps = [
  { id: 1, name: 'Email', description: 'Tu correo' },
  { id: 2, name: 'Pago', description: 'Datos de tarjeta' },
  { id: 3, name: 'Listo', description: 'Confirmacion' },
];

export default function IzipayModal({ isOpen, onClose, plan, userEmail: initialEmail }: IzipayModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formToken, setFormToken] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [email, setEmail] = useState(initialEmail || '');
  const [emailError, setEmailError] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [step, setStep] = useState(1);
  const [emailFocused, setEmailFocused] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadIzipayScript();
      setStep(1);
      setShowPaymentForm(false);
      setPaymentSuccess(false);
      setError('');
      if (initialEmail) {
        setEmail(initialEmail);
      }
    }
  }, [isOpen, initialEmail]);

  const handleContinue = () => {
    if (!email || !email.includes('@') || !email.includes('.')) {
      setEmailError('Ingresa un correo valido');
      return;
    }
    
    setEmailError('');
    setStep(2);
    setShowPaymentForm(true);
    createPaymentToken();
  };

  const handleBack = () => {
    setStep(1);
    setShowPaymentForm(false);
    setError('');
  };

  const loadIzipayScript = () => {
    if (!document.getElementById('izipay-css')) {
      const link = document.createElement('link');
      link.id = 'izipay-css';
      link.rel = 'stylesheet';
      link.href = 'https://static.micuentaweb.pe/static/js/krypton-client/V4.0/ext/classic-reset.css';
      document.head.appendChild(link);
    }

    if (document.getElementById('izipay-script')) {
      return;
    }

    const script = document.createElement('script');
    script.id = 'izipay-script';
    script.src = process.env.NEXT_PUBLIC_IZIPAY_JS_URL || 'https://static.micuentaweb.pe/static/js/krypton-client/V4.0/stable/kr-payment-form.min.js';
    script.async = true;
    document.body.appendChild(script);
  };

  const createPaymentToken = async () => {
    try {
      setLoading(true);
      setError('');

      const orderId = `ORDER-${Date.now()}`;
      
      const response = await fetch('/api/payment/create-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: plan.price,
          currency: 'PEN',
          orderId: orderId,
          customerEmail: email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Error al crear el token de pago');
      }

      setFormToken(data.formToken);
      
      setTimeout(() => {
        initializeIzipayForm(data.formToken);
      }, 500);

    } catch (err: any) {
      setError(err.message || 'Error al inicializar el pago');
      setLoading(false);
    }
  };

  const initializeIzipayForm = (token: string) => {
    if (!window.KR) {
      setError('Error al cargar el formulario de pago');
      setLoading(false);
      return;
    }

    const publicKey = process.env.NEXT_PUBLIC_IZIPAY_PUBLIC_KEY;

    window.KR.setFormConfig({
      formToken: token,
      'kr-public-key': publicKey,
      'kr-language': 'es-ES',
      'kr-placeholder-pan': 'Numero de tarjeta',
      'kr-placeholder-expiry': 'MM/AA',
      'kr-placeholder-security-code': 'CVV',
      'kr-hide-debug-toolbar': true,
    });

    window.KR.setFormConfig({
      'kr-theme': 'material',
      'kr-card-form-expanded': true,
    });

    window.KR.onSubmit(async (paymentData: any) => {
      setProcessing(true);
      
      try {
        if (paymentData.clientAnswer.orderStatus === 'PAID') {
          setPaymentSuccess(true);
          setProcessing(false);
          setStep(3);
          
          setTimeout(() => {
            window.location.href = '/login?payment=success';
          }, 3000);
        } else {
          setError('El pago no se completo. Intenta de nuevo.');
          setProcessing(false);
        }
      } catch (err) {
        setError('Error al procesar el pago');
        setProcessing(false);
      }
      
      return false;
    });

    window.KR.onError((error: any) => {
      const errorMessage = error?.detailedErrorMessage || error?.errorMessage || 'Error desconocido';
      setError(`Error: ${errorMessage}`);
      setProcessing(false);
    });

    window.KR.onFormReady(() => {
      setLoading(false);
    });

    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        {/* Overlay with blur */}
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-3xl w-full max-w-md overflow-hidden border border-zinc-800/50 shadow-2xl shadow-black/50 animate-scaleIn">
          
          {/* Decorative gradient */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />
          
          {/* Header */}
          <div className="relative p-6 pb-4">
            {/* Close & Back buttons */}
            <div className="flex items-center justify-between mb-4">
              {step === 2 && !processing && !paymentSuccess ? (
                <button
                  onClick={handleBack}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-xl transition-all duration-200"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
              ) : (
                <div className="w-9" />
              )}
              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-xl transition-all duration-200"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            {/* Plan Info */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <CreditCardIcon className="h-7 w-7 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                  <SparklesIcon className="h-3 w-3 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  Plan {plan.name}
                </h3>
                <p className="text-emerald-400 font-bold text-lg">
                  {plan.price === 0 ? 'Gratis' : `S/ ${plan.price}`}
                  {plan.price > 0 && <span className="text-sm font-normal text-zinc-400 ml-1">{plan.period}</span>}
                </p>
              </div>
            </div>

            {/* Progress Steps - Modern Design */}
            <div className="relative">
              {/* Progress Bar Background */}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-zinc-800" />
              {/* Progress Bar Fill */}
              <div 
                className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500 ease-out"
                style={{ width: `${((step - 1) / 2) * 100}%` }}
              />
              
              {/* Step Indicators */}
              <div className="relative flex justify-between">
                {steps.map((s, index) => (
                  <div key={s.id} className="flex flex-col items-center">
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                        s.id < step 
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                          : s.id === step 
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-500/20' 
                            : 'bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {s.id < step ? (
                        <CheckIcon className="h-5 w-5" />
                      ) : (
                        <span className="text-sm font-bold">{s.id}</span>
                      )}
                    </div>
                    <span className={`text-xs font-medium mt-2 transition-colors ${
                      s.id <= step ? 'text-emerald-400' : 'text-zinc-500'
                    }`}>
                      {s.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent mx-6" />

          {/* Body */}
          <div className="p-6 pt-5">
            {/* Success State */}
            {paymentSuccess && (
              <div className="text-center py-6 animate-fadeIn">
                <div className="relative mx-auto w-20 h-20 mb-6">
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
                  <div className="relative w-full h-full bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40">
                    <CheckIcon className="h-10 w-10 text-white" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-2">
                  Pago exitoso
                </h3>
                
                <p className="text-zinc-400 mb-6">
                  Tu suscripcion ha sido activada correctamente.
                </p>
                
                <div className="bg-zinc-800/50 rounded-2xl p-5 mb-6 border border-zinc-700/50">
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-zinc-400">Plan adquirido</span>
                    <span className="font-bold text-white">{plan.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-zinc-400">Email</span>
                    <span className="text-white truncate ml-4">{email}</span>
                  </div>
                  <div className="h-px bg-zinc-700/50 my-3" />
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Total pagado</span>
                    <span className="font-bold text-emerald-400 text-xl">S/ {plan.price}</span>
                  </div>
                </div>
                
                <p className="text-sm text-zinc-500 mb-4">
                  Redirigiendo al inicio de sesion...
                </p>
                
                <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full animate-progressBar"></div>
                </div>
              </div>
            )}
            
            {/* Processing State */}
            {processing && !paymentSuccess && (
              <div className="text-center py-12 animate-fadeIn">
                <div className="relative mx-auto w-16 h-16 mb-6">
                  <div className="absolute inset-0 rounded-full border-2 border-zinc-700" />
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-500 animate-spin" />
                  <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-emerald-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Procesando pago...</h3>
                <p className="text-sm text-zinc-400">Por favor, no cierres esta ventana</p>
                <div className="flex items-center justify-center gap-2 mt-4 text-xs text-zinc-500">
                  <LockClosedIcon className="w-3 h-3" />
                  <span>Transaccion segura en proceso</span>
                </div>
              </div>
            )}
            
            {/* Loading State */}
            {loading && !processing && (
              <div className="text-center py-12 animate-fadeIn">
                <div className="relative mx-auto w-12 h-12 mb-6">
                  <div className="absolute inset-0 rounded-full border-2 border-zinc-700" />
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-500 animate-spin" />
                </div>
                <p className="text-zinc-400 text-sm">
                  Preparando formulario de pago seguro...
                </p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-5 animate-shake">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <XMarkIcon className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-red-400 font-semibold text-sm mb-1">Hubo un error</h4>
                    <p className="text-red-300/80 text-sm">{error}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setError('');
                    if (step === 2) createPaymentToken();
                  }}
                  className="w-full mt-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl text-sm font-medium transition-colors"
                >
                  Intentar de nuevo
                </button>
              </div>
            )}

            {/* Step 1: Email */}
            {!loading && !error && !showPaymentForm && !paymentSuccess && (
              <div className="animate-fadeIn">
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-white mb-2.5">
                    Correo electronico
                  </label>
                  <div className={`relative rounded-2xl transition-all duration-300 ${
                    emailFocused ? 'ring-2 ring-emerald-500/50' : ''
                  }`}>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailError('');
                      }}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      placeholder="tu@correo.com"
                      className={`w-full px-4 py-4 bg-zinc-800/80 border-2 rounded-2xl focus:border-emerald-500 outline-none transition-all text-white placeholder:text-zinc-500 ${
                        emailError ? 'border-red-500' : emailFocused ? 'border-emerald-500' : 'border-zinc-700/50'
                      }`}
                    />
                    {email && email.includes('@') && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <CheckIcon className="w-5 h-5 text-emerald-400" />
                      </div>
                    )}
                  </div>
                  {emailError && (
                    <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                      <XMarkIcon className="w-3 h-3" />
                      {emailError}
                    </p>
                  )}
                  <p className="text-zinc-500 text-xs mt-2.5">
                    Te enviaremos tus credenciales de acceso a este correo.
                  </p>
                </div>

                {/* Order Summary */}
                <div className="bg-zinc-800/50 rounded-2xl p-5 mb-5 border border-zinc-700/50">
                  <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <SparklesIcon className="w-4 h-4 text-emerald-400" />
                    Resumen de compra
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Plan seleccionado</span>
                      <span className="text-white font-semibold bg-zinc-700/50 px-3 py-1 rounded-lg">{plan.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Periodo</span>
                      <span className="text-zinc-300">{plan.period}</span>
                    </div>
                    <div className="h-px bg-zinc-700/50 my-1" />
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-white font-semibold">Total a pagar</span>
                      <span className="text-emerald-400 font-bold text-2xl">S/ {plan.price}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleContinue}
                  disabled={!email}
                  className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
                    email 
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-zinc-950 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98]' 
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  Continuar al pago
                </button>

                {/* Security Note */}
                <div className="flex items-center justify-center gap-2 mt-4 text-xs text-zinc-500">
                  <ShieldCheckIcon className="w-4 h-4 text-emerald-500/70" />
                  <span>Tus datos estan protegidos con encriptacion SSL</span>
                </div>
              </div>
            )}

            {/* Step 2: Payment Form */}
            {!loading && !error && showPaymentForm && !paymentSuccess && !processing && (
              <div className="animate-fadeIn">
                {/* Email Confirmed Badge */}
                <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 mb-5">
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckIcon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-emerald-400/80 font-medium">Email confirmado</p>
                    <p className="text-emerald-300 font-semibold truncate">{email}</p>
                  </div>
                </div>

                {/* Total Amount Card */}
                <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-800/40 rounded-2xl p-5 mb-5 border border-zinc-700/50">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-zinc-400 text-sm mb-1">Total a pagar</p>
                      <p className="text-white text-3xl font-bold">
                        S/ {plan.price}
                      </p>
                    </div>
                    <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
                      <CreditCardIcon className="w-7 h-7 text-emerald-400" />
                    </div>
                  </div>
                </div>

                {/* Payment Form Container */}
                <div className="bg-zinc-800/30 rounded-2xl p-5 mb-5 border border-zinc-700/50">
                  <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <LockClosedIcon className="w-4 h-4 text-emerald-400" />
                    Datos de pago seguros
                  </h4>
                  <div className="izipay-form-container">
                    <div className="kr-embedded" kr-form-token={formToken}>
                      {/* Izipay form renders here */}
                    </div>
                  </div>
                </div>

                {/* Security Badges */}
                <div className="flex items-center justify-center gap-6 text-xs text-zinc-500">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheckIcon className="w-4 h-4 text-emerald-500" />
                    <span>Pago 100% seguro</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <LockClosedIcon className="w-4 h-4 text-emerald-500" />
                    <span>Encriptado SSL</span>
                  </div>
                </div>
                
                {/* Accepted Cards */}
                <div className="flex items-center justify-center gap-3 mt-4 opacity-50">
                  <div className="bg-white rounded px-2 py-1">
                    <svg className="h-4 w-auto" viewBox="0 0 38 24" fill="none">
                      <path fill="#1A1F71" d="M15.5 7.5h-1.8L12 16.5h1.8l.6-2.3h2.2l.6 2.3h1.8L17.3 7.5h-1.8zm-1.1 5l.6-2.5.6 2.5h-1.2z"/>
                      <path fill="#FF5F00" d="M24 8.5a3.9 3.9 0 00-3 1.4 3.9 3.9 0 00-3-1.4 4 4 0 00-4 4 4 4 0 004 4 3.9 3.9 0 003-1.4 3.9 3.9 0 003 1.4 4 4 0 004-4 4 4 0 00-4-4z"/>
                    </svg>
                  </div>
                  <div className="bg-white rounded px-2 py-1">
                    <svg className="h-4 w-auto" viewBox="0 0 38 24" fill="none">
                      <rect width="38" height="24" rx="4" fill="#006FCF"/>
                      <text x="5" y="16" fill="white" fontSize="8" fontWeight="bold">VISA</text>
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Custom Styles for Izipay */}
          <style jsx global>{`
            @keyframes progressBar {
              from { width: 0%; }
              to { width: 100%; }
            }
            
            @keyframes shake {
              0%, 100% { transform: translateX(0); }
              25% { transform: translateX(-4px); }
              75% { transform: translateX(4px); }
            }
            
            .animate-progressBar {
              animation: progressBar 3s linear forwards;
            }
            
            .animate-shake {
              animation: shake 0.3s ease-in-out;
            }
            
            .animate-scaleIn {
              animation: scaleIn 0.3s ease-out;
            }
            
            @keyframes scaleIn {
              from {
                opacity: 0;
                transform: scale(0.95);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
            
            .animate-fadeIn {
              animation: fadeIn 0.3s ease-out;
            }
            
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            
            /* Izipay Form Custom Styles - Dark Theme */
            .izipay-form-container .kr-embedded {
              font-family: inherit !important;
            }
            
            .izipay-form-container .kr-embedded * {
              font-family: inherit !important;
            }
            
            /* Input fields styling */
            .izipay-form-container .kr-pan,
            .izipay-form-container .kr-expiry,
            .izipay-form-container .kr-security-code,
            .izipay-form-container .kr-installment-number,
            .izipay-form-container .kr-first-installment-delay,
            .izipay-form-container .kr-identity-document-number,
            .izipay-form-container .kr-card-holder-name,
            .izipay-form-container .kr-field,
            .izipay-form-container input,
            .izipay-form-container select {
              background-color: #27272a !important;
              border: 2px solid #3f3f46 !important;
              border-radius: 1rem !important;
              padding: 1rem !important;
              font-size: 0.95rem !important;
              margin-bottom: 0.875rem !important;
              color: #ffffff !important;
              transition: all 0.2s ease !important;
            }
            
            .izipay-form-container .kr-pan:focus,
            .izipay-form-container .kr-expiry:focus,
            .izipay-form-container .kr-security-code:focus,
            .izipay-form-container .kr-installment-number:focus,
            .izipay-form-container .kr-first-installment-delay:focus,
            .izipay-form-container .kr-identity-document-number:focus,
            .izipay-form-container .kr-card-holder-name:focus,
            .izipay-form-container .kr-field:focus,
            .izipay-form-container input:focus,
            .izipay-form-container select:focus {
              border-color: #10b981 !important;
              box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15) !important;
              outline: none !important;
            }
            
            /* Placeholder text */
            .izipay-form-container input::placeholder {
              color: #71717a !important;
            }
            
            /* Labels */
            .izipay-form-container .kr-field-label,
            .izipay-form-container label {
              color: #a1a1aa !important;
              font-size: 0.75rem !important;
              font-weight: 600 !important;
              text-transform: uppercase !important;
              letter-spacing: 0.05em !important;
              margin-bottom: 0.5rem !important;
              display: block !important;
            }
            
            /* Icons */
            .izipay-form-container .kr-icon,
            .izipay-form-container .kr-field-icon {
              color: #71717a !important;
            }
            
            /* Pay button - Primary CTA */
            .izipay-form-container .kr-payment-button,
            .izipay-form-container button[type="submit"] {
              background: linear-gradient(135deg, #10b981 0%, #34d399 100%) !important;
              border-radius: 1rem !important;
              font-weight: 700 !important;
              font-size: 1rem !important;
              padding: 1rem 1.5rem !important;
              border: none !important;
              color: #09090b !important;
              width: 100% !important;
              margin-top: 0.75rem !important;
              cursor: pointer !important;
              transition: all 0.2s ease !important;
              box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35) !important;
            }
            
            .izipay-form-container .kr-payment-button:hover,
            .izipay-form-container button[type="submit"]:hover {
              background: linear-gradient(135deg, #34d399 0%, #10b981 100%) !important;
              transform: translateY(-1px) !important;
              box-shadow: 0 6px 20px rgba(16, 185, 129, 0.45) !important;
            }
            
            .izipay-form-container .kr-payment-button:active,
            .izipay-form-container button[type="submit"]:active {
              transform: translateY(0) !important;
            }
            
            /* Select dropdowns */
            .izipay-form-container select {
              appearance: none !important;
              background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2371717a' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") !important;
              background-position: right 0.75rem center !important;
              background-repeat: no-repeat !important;
              background-size: 1.25rem !important;
              padding-right: 2.5rem !important;
            }
            
            /* Error states */
            .izipay-form-container .kr-field-error,
            .izipay-form-container .kr-form-error {
              color: #f87171 !important;
              font-size: 0.75rem !important;
              margin-top: 0.25rem !important;
            }
            
            .izipay-form-container .kr-pan.kr-error,
            .izipay-form-container .kr-expiry.kr-error,
            .izipay-form-container .kr-security-code.kr-error {
              border-color: #ef4444 !important;
            }
            
            /* Card brand icons */
            .izipay-form-container .kr-brand-icon {
              filter: brightness(0) invert(0.7) !important;
            }
            
            /* Help tooltips */
            .izipay-form-container .kr-help-button {
              color: #71717a !important;
            }
            
            /* Form wrapper */
            .izipay-form-container .kr-smart-form,
            .izipay-form-container .kr-embedded-wrapper {
              background: transparent !important;
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}
