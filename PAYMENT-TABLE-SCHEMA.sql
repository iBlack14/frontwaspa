-- =====================================================
-- TABLA DE PAGOS PARA IZIPAY
-- =====================================================
-- Descripción: Tabla para registrar todos los pagos realizados
-- Fecha: 2025-11-08
-- =====================================================

-- Crear tabla de pagos
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_id TEXT NOT NULL UNIQUE,
  transaction_id TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'PEN',
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method TEXT,
  plan_type TEXT,
  plan_name TEXT,
  customer_email TEXT,
  izipay_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at 
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" 
  ON public.payments FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own payments" ON public.payments;
CREATE POLICY "Users can insert own payments" 
  ON public.payments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Comentarios
COMMENT ON TABLE public.payments IS 'Registro de pagos realizados por los usuarios';
COMMENT ON COLUMN public.payments.order_id IS 'ID único de la orden de pago';
COMMENT ON COLUMN public.payments.transaction_id IS 'ID de transacción de Izipay';
COMMENT ON COLUMN public.payments.status IS 'Estado del pago: pending, paid, failed, refunded';
COMMENT ON COLUMN public.payments.izipay_response IS 'Respuesta completa de Izipay en formato JSON';

-- =====================================================
-- FIN DEL SCHEMA DE PAGOS
-- =====================================================
