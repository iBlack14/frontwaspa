-- ============================================
-- Script de limpieza para producción
-- BLXK Studio - Payment System
-- ============================================
-- ADVERTENCIA: Este script elimina datos de prueba
-- Ejecutar SOLO antes de ir a producción
-- ============================================

BEGIN;

-- 1. Eliminar pagos de prueba
DELETE FROM public.payments 
WHERE 
  order_id LIKE 'ORDER-TEST%' 
  OR order_id LIKE '%test%'
  OR customer_email LIKE '%@test.com'
  OR customer_email LIKE '%@example.com';

-- 2. Eliminar suscripciones de prueba
DELETE FROM public.user_subscriptions
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email LIKE '%@test.com' OR email LIKE '%@example.com'
);

-- 3. Eliminar perfiles de prueba
DELETE FROM public.profiles
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email LIKE '%@test.com' OR email LIKE '%@example.com'
);

-- 4. Eliminar usuarios de prueba de Auth
DELETE FROM auth.users
WHERE 
  email LIKE '%@test.com' 
  OR email LIKE '%@example.com'
  OR email LIKE 'test%'
  OR email = 'user@example.com';

-- 5. Verificar que todo esté limpio
SELECT 
  'payments' as tabla, 
  COUNT(*) as registros_restantes 
FROM public.payments
UNION ALL
SELECT 'profiles', COUNT(*) FROM public.profiles
UNION ALL
SELECT 'user_subscriptions', COUNT(*) FROM public.user_subscriptions
UNION ALL
SELECT 'auth.users', COUNT(*) FROM auth.users;

COMMIT;

-- ============================================
-- Verificaciones adicionales
-- ============================================

-- Verificar RLS está habilitado
SELECT 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('payments', 'profiles', 'user_subscriptions')
ORDER BY tablename;

-- Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('payments', 'profiles', 'user_subscriptions')
ORDER BY tablename, policyname;
