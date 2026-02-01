import { useEffect, useState } from 'react';
import { XMarkIcon, CheckIcon, ShieldCheckIcon, LockClosedIcon, CreditCardIcon } from '@heroicons/react/24/outline';

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
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-zinc-900 rounded-2xl w-full max-w-lg overflow-hidden border border-zinc-800 shadow-2xl animate-scaleIn">
          {/* Header */}
          <div className="relative p-6 border-b border-zinc-800">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <CreditCardIcon className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Plan {plan.name}
                </h3>
                <p className="text-emerald-400 font-semibold">
                  {plan.price === 0 ? 'Gratis' : `S/ ${plan.price} ${plan.period}`}
                </p>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center gap-2 mt-6">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex-1 flex items-center">
                  <div className={`w-full h-1 rounded-full transition-colors ${
                    s <= step ? 'bg-emerald-500' : 'bg-zinc-700'
                  }`} />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-zinc-500">
              <span className={step >= 1 ? 'text-emerald-400' : ''}>Email</span>
              <span className={step >= 2 ? 'text-emerald-400' : ''}>Pago</span>
              <span className={step >= 3 ? 'text-emerald-400' : ''}>Listo</span>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            {/* Success State */}
            {paymentSuccess && (
              <div className="text-center py-8 animate-fadeIn">
                <div className="mx-auto w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                  <CheckIcon className="h-8 w-8 text-emerald-400" />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">
                  Pago exitoso
                </h3>
                
                <p className="text-zinc-400 mb-6">
                  Tu pago ha sido procesado correctamente.
                </p>
                
                <div className="bg-zinc-800/50 rounded-xl p-4 mb-6 border border-zinc-700">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-zinc-400">Plan</span>
                    <span className="font-semibold text-white">{plan.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Total</span>
                    <span className="font-bold text-emerald-400">S/ {plan.price}</span>
                  </div>
                </div>
                
                <p className="text-xs text-zinc-500">
                  Redirigiendo al inicio de sesion...
                </p>
                
                <div className="mt-4 w-full bg-zinc-800 rounded-full h-1">
                  <div className="bg-emerald-500 h-1 rounded-full" style={{ animation: 'progress 3s linear' }}></div>
                </div>
              </div>
            )}
            
            {/* Processing State */}
            {processing && !paymentSuccess && (
              <div className="text-center py-12 animate-fadeIn">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-zinc-700 border-t-emerald-500 mx-auto mb-6"></div>
                <h3 className="text-lg font-bold text-white mb-2">Procesando pago...</h3>
                <p className="text-sm text-zinc-400">No cierres esta ventana</p>
              </div>
            )}
            
            {/* Loading State */}
            {loading && !processing && (
              <div className="text-center py-12 animate-fadeIn">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-zinc-700 border-t-emerald-500 mx-auto mb-6"></div>
                <p className="text-zinc-400 text-sm">
                  Preparando formulario de pago seguro...
                </p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 animate-fadeIn">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <XMarkIcon className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <h4 className="text-red-400 font-semibold text-sm mb-1">Error</h4>
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Email */}
            {!loading && !error && !showPaymentForm && !paymentSuccess && (
              <div className="animate-fadeIn">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Correo electronico
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError('');
                    }}
                    placeholder="tu@correo.com"
                    className={`w-full px-4 py-3 bg-zinc-800 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-white placeholder:text-zinc-500 ${
                      emailError ? 'border-red-500' : 'border-zinc-700'
                    }`}
                  />
                  {emailError && (
                    <p className="text-red-400 text-xs mt-2">{emailError}</p>
                  )}
                  <p className="text-zinc-500 text-xs mt-2">
                    Te enviaremos tus credenciales a este correo.
                  </p>
                </div>

                {/* Order Summary */}
                <div className="bg-zinc-800/50 rounded-xl p-4 mb-6 border border-zinc-700">
                  <h4 className="text-sm font-semibold text-white mb-3">Resumen</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Plan</span>
                      <span className="text-white font-medium">{plan.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Periodo</span>
                      <span className="text-white">{plan.period}</span>
                    </div>
                    <div className="border-t border-zinc-700 pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="text-white font-semibold">Total</span>
                        <span className="text-emerald-400 font-bold text-lg">S/ {plan.price}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleContinue}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-emerald-500/20"
                >
                  Continuar al pago
                </button>
              </div>
            )}

            {/* Step 2: Payment Form */}
            {!loading && !error && showPaymentForm && !paymentSuccess && !processing && (
              <div className="animate-fadeIn">
                {/* Email Confirmed */}
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mb-6">
                  <CheckIcon className="h-4 w-4 text-emerald-400" />
                  <span className="text-emerald-300 text-sm font-medium">{email}</span>
                </div>

                {/* Order Summary */}
                <div className="bg-zinc-800/50 rounded-xl p-4 mb-6 border border-zinc-700">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400">Total a pagar</span>
                    <span className="text-emerald-400 font-bold text-xl">S/ {plan.price}</span>
                  </div>
                </div>

                {/* Payment Form Container */}
                <div className="bg-zinc-800/30 rounded-xl p-4 mb-6 border border-zinc-700">
                  <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <LockClosedIcon className="w-4 h-4 text-emerald-400" />
                    Datos de pago
                  </h4>
                  <div className="izipay-form-container">
                    <div className="kr-embedded" kr-form-token={formToken}>
                      {/* Izipay form renders here */}
                    </div>
                  </div>
                </div>

                {/* Security Badges */}
                <div className="flex items-center justify-center gap-4 text-xs text-zinc-500">
                  <div className="flex items-center gap-1">
                    <ShieldCheckIcon className="w-4 h-4 text-emerald-500" />
                    <span>Pago seguro</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <LockClosedIcon className="w-4 h-4 text-emerald-500" />
                    <span>Encriptado SSL</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <style jsx>{`
            @keyframes progress {
              from { width: 0%; }
              to { width: 100%; }
            }
            
            .izipay-form-container :global(.kr-embedded) {
              font-family: inherit;
            }
            
            .izipay-form-container :global(.kr-pan),
            .izipay-form-container :global(.kr-expiry),
            .izipay-form-container :global(.kr-security-code) {
              border: 1px solid #3f3f46 !important;
              border-radius: 0.75rem !important;
              padding: 0.75rem !important;
              font-size: 0.875rem !important;
              margin-bottom: 0.75rem !important;
              background-color: #27272a !important;
              color: #fff !important;
            }
            
            .izipay-form-container :global(.kr-pan:focus),
            .izipay-form-container :global(.kr-expiry:focus),
            .izipay-form-container :global(.kr-security-code:focus) {
              border-color: #10b981 !important;
              box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2) !important;
            }
            
            .izipay-form-container :global(.kr-payment-button) {
              background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%) !important;
              border-radius: 0.75rem !important;
              font-weight: 600 !important;
              padding: 0.875rem !important;
              border: none !important;
              color: #09090b !important;
              width: 100% !important;
              margin-top: 0.5rem !important;
            }
            
            .izipay-form-container :global(.kr-payment-button:hover) {
              opacity: 0.9 !important;
            }
            
            .izipay-form-container :global(.kr-field-label) {
              color: #a1a1aa !important;
              font-size: 0.75rem !important;
              font-weight: 500 !important;
              text-transform: uppercase !important;
              letter-spacing: 0.05em !important;
            }
            
            .izipay-form-container :global(.kr-icon) {
              color: #a1a1aa !important;
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}
