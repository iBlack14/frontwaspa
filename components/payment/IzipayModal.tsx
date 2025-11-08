import { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface IzipayModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: {
    name: string;
    price: number;
    period: string;
  };
  userEmail: string;
}

declare global {
  interface Window {
    KR: any;
  }
}

export default function IzipayModal({ isOpen, onClose, plan, userEmail }: IzipayModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formToken, setFormToken] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadIzipayScript();
      createPaymentToken();
    }
  }, [isOpen]);

  const loadIzipayScript = () => {
    // Cargar el CSS de Izipay si no está cargado
    if (!document.getElementById('izipay-css')) {
      const link = document.createElement('link');
      link.id = 'izipay-css';
      link.rel = 'stylesheet';
      link.href = 'https://static.micuentaweb.pe/static/js/krypton-client/V4.0/ext/classic-reset.css';
      document.head.appendChild(link);
    }

    // Cargar el script de Izipay si no está cargado
    if (document.getElementById('izipay-script')) {
      return;
    }

    const script = document.createElement('script');
    script.id = 'izipay-script';
    script.src = process.env.NEXT_PUBLIC_IZIPAY_JS_URL || 'https://static.micuentaweb.pe/static/js/krypton-client/V4.0/stable/kr-payment-form.min.js';
    script.async = true;
    script.onload = () => {
      console.log('[Izipay] Script loaded successfully');
    };
    document.body.appendChild(script);
  };

  const createPaymentToken = async () => {
    try {
      setLoading(true);
      setError('');

      const orderId = `ORDER-${Date.now()}`;
      
      console.log('[Izipay] Creating payment token with:', {
        amount: plan.price,
        currency: 'PEN',
        orderId,
        customerEmail: userEmail
      });
      
      const response = await fetch('/api/payment/create-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: plan.price,
          currency: 'PEN',
          orderId: orderId,
          customerEmail: userEmail,
        }),
      });

      const data = await response.json();
      
      console.log('[Izipay] Token response:', data);

      if (!response.ok) {
        console.error('[Izipay] Token creation failed:', data);
        throw new Error(data.error || data.details || 'Error al crear el token de pago');
      }

      setFormToken(data.formToken);
      
      // Inicializar el formulario de Izipay
      setTimeout(() => {
        initializeIzipayForm(data.formToken);
      }, 500);

    } catch (err: any) {
      console.error('[Izipay] Error:', err);
      setError(err.message || 'Error al inicializar el pago');
      setLoading(false);
    }
  };

  const initializeIzipayForm = (token: string) => {
    if (!window.KR) {
      console.error('[Izipay] KR object not found');
      setError('Error al cargar el formulario de pago');
      setLoading(false);
      return;
    }

    const publicKey = process.env.NEXT_PUBLIC_IZIPAY_PUBLIC_KEY;

    window.KR.setFormConfig({
      formToken: token,
      'kr-public-key': publicKey,
      'kr-language': 'es-ES',
      'kr-placeholder-pan': 'Número de tarjeta',
      'kr-placeholder-expiry': 'MM/AA',
      'kr-placeholder-security-code': 'CVV',
      'kr-hide-debug-toolbar': true,
    });

    // Personalizar estilos del formulario
    window.KR.setFormConfig({
      'kr-theme': 'material',
      'kr-card-form-expanded': true,
    });

    window.KR.onSubmit(async (paymentData: any) => {
      console.log('[Izipay] Payment submitted:', paymentData);
      setProcessing(true);
      
      try {
        // Aquí puedes procesar la respuesta del pago
        if (paymentData.clientAnswer.orderStatus === 'PAID') {
          console.log('[Izipay] Payment successful!');
          alert('¡Pago exitoso! Redirigiendo al dashboard...');
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1500);
        } else {
          console.log('[Izipay] Payment not completed:', paymentData.clientAnswer.orderStatus);
          setError('El pago no se completó. Por favor, intenta de nuevo.');
          setProcessing(false);
        }
      } catch (err) {
        console.error('[Izipay] Error processing payment:', err);
        setError('Error al procesar el pago');
        setProcessing(false);
      }
      
      return false; // Prevenir el submit por defecto
    });

    window.KR.onError((error: any) => {
      console.error('[Izipay] Payment error:', error);
      const errorMessage = error?.detailedErrorMessage || error?.errorMessage || 'Error desconocido';
      setError(`Error al procesar el pago: ${errorMessage}`);
      setProcessing(false);
    });

    // Evento cuando el pago es exitoso
    window.KR.onFormReady(() => {
      console.log('[Izipay] Form ready');
      setLoading(false);
    });

    // Evento cuando el pago es procesado
    window.KR.onFormCreated(() => {
      console.log('[Izipay] Form created');
    });

    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-6 relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-2 transition"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">
                  Plan {plan.name}
                </h3>
                <p className="text-white/90 text-lg font-semibold mt-1">
                  {plan.price === 0 ? 'Gratis' : `S/ ${plan.price} ${plan.period}`}
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-8 py-8 bg-gray-50">
            {processing && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-8 max-w-sm mx-4">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-emerald-500 mx-auto"></div>
                    <h3 className="mt-4 text-xl font-bold text-gray-900">Procesando pago...</h3>
                    <p className="mt-2 text-gray-600">Por favor espera, no cierres esta ventana</p>
                  </div>
                </div>
              </div>
            )}
            
            {loading && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-emerald-500"></div>
                </div>
                <p className="mt-6 text-gray-600 font-medium text-lg">
                  Preparando formulario de pago seguro...
                </p>
                <p className="mt-2 text-gray-500 text-sm">
                  Esto solo tomará un momento
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 mb-6">
                <div className="flex items-start">
                  <svg className="h-6 w-6 text-red-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-red-800 font-semibold mb-1">Error al procesar el pago</h4>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {!loading && !error && (
              <div>
                {/* Información del plan */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                  <h4 className="text-gray-900 font-semibold text-lg mb-4">Resumen de tu compra</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Plan seleccionado</span>
                      <span className="text-gray-900 font-semibold">{plan.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Periodo</span>
                      <span className="text-gray-900 font-medium">{plan.period}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-900 font-semibold text-lg">Total</span>
                        <span className="text-emerald-600 font-bold text-2xl">S/ {plan.price}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Formulario de Izipay */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                  <h4 className="text-gray-900 font-semibold text-lg mb-4">Información de pago</h4>
                  <div className="izipay-form-container">
                    <div className="kr-embedded" kr-form-token={formToken}>
                      {/* El formulario se renderizará aquí */}
                    </div>
                  </div>
                </div>
                
                <style jsx>{`
                  .izipay-form-container :global(.kr-embedded) {
                    font-family: inherit;
                  }
                  
                  .izipay-form-container :global(.kr-pan),
                  .izipay-form-container :global(.kr-expiry),
                  .izipay-form-container :global(.kr-security-code) {
                    border: 1px solid #e5e7eb !important;
                    border-radius: 0.5rem !important;
                    padding: 0.75rem !important;
                    font-size: 1rem !important;
                    margin-bottom: 1rem !important;
                    background-color: white !important;
                  }
                  
                  .izipay-form-container :global(.kr-pan:focus),
                  .izipay-form-container :global(.kr-expiry:focus),
                  .izipay-form-container :global(.kr-security-code:focus) {
                    border-color: #10b981 !important;
                    outline: none !important;
                    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1) !important;
                  }
                  
                  .izipay-form-container :global(.kr-form-error) {
                    color: #ef4444 !important;
                    font-size: 0.875rem !important;
                    margin-top: 0.25rem !important;
                  }
                  
                  .izipay-form-container :global(button[type="submit"]) {
                    background: linear-gradient(to right, #10b981, #14b8a6) !important;
                    color: white !important;
                    font-weight: 600 !important;
                    padding: 0.875rem 2rem !important;
                    border-radius: 0.75rem !important;
                    border: none !important;
                    width: 100% !important;
                    font-size: 1.125rem !important;
                    cursor: pointer !important;
                    transition: all 0.2s !important;
                  }
                  
                  .izipay-form-container :global(button[type="submit"]:hover) {
                    transform: translateY(-1px) !important;
                    box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3) !important;
                  }
                  
                  .izipay-form-container :global(button[type="submit"]:active) {
                    transform: translateY(0) !important;
                  }
                  
                  .izipay-form-container :global(label) {
                    color: #374151 !important;
                    font-weight: 500 !important;
                    margin-bottom: 0.5rem !important;
                    display: block !important;
                  }
                `}</style>

                {/* Información de seguridad */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6">
                  <div className="flex items-start space-x-3">
                    <svg className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <div>
                      <h5 className="text-gray-900 font-semibold mb-1">Pago 100% seguro</h5>
                      <p className="text-gray-600 text-sm">
                        Tu información está protegida con encriptación de nivel bancario. Powered by <span className="font-semibold">Izipay</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
