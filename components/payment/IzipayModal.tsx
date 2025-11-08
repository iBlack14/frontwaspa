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

  useEffect(() => {
    if (isOpen) {
      loadIzipayScript();
      createPaymentToken();
    }
  }, [isOpen]);

  const loadIzipayScript = () => {
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

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear el token de pago');
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
    });

    window.KR.onSubmit((paymentData: any) => {
      console.log('[Izipay] Payment submitted:', paymentData);
      return true;
    });

    window.KR.onError((error: any) => {
      console.error('[Izipay] Payment error:', error);
      setError('Error al procesar el pago');
    });

    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white dark:bg-zinc-900 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">
                Pago Seguro - Plan {plan.name}
              </h3>
              <p className="text-emerald-100 text-sm mt-1">
                {plan.price === 0 ? 'Gratis' : `S/ ${plan.price} ${plan.period}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-6">
            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">
                  Cargando formulario de pago...
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                <p className="text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {!loading && !error && (
              <div>
                {/* Formulario de Izipay */}
                <div className="kr-embedded" kr-form-token={formToken}>
                  {/* El formulario se renderizará aquí */}
                </div>

                {/* Información de seguridad */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-zinc-700">
                  <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>🔒 Pago 100% seguro</span>
                    <span>•</span>
                    <span>Powered by Izipay</span>
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
