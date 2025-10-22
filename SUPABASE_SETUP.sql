-- ========================================
-- SCRIPT DE CONFIGURACIÓN SUPABASE
-- Ejecuta este script en: SQL Editor de Supabase
-- ========================================

-- ========================================
-- 1. TABLA PROFILES (Usuarios)
-- ========================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT,
  email TEXT UNIQUE NOT NULL,
  status_plan BOOLEAN DEFAULT FALSE,
  plan_type TEXT,
  api_key TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ========================================
-- 2. TABLA INSTANCES (Instancias WhatsApp)
-- ========================================
CREATE TABLE IF NOT EXISTS instances (
  id SERIAL PRIMARY KEY,
  document_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  state TEXT DEFAULT 'Disconnected',
  qr TEXT,
  profile_name TEXT,
  phone_number TEXT,
  profile_picture TEXT,
  webhook_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_instances_user_id ON instances(user_id);
CREATE INDEX IF NOT EXISTS idx_instances_document_id ON instances(document_id);
CREATE INDEX IF NOT EXISTS idx_instances_state ON instances(state);

-- Row Level Security (RLS)
ALTER TABLE instances ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Users can view own instances"
  ON instances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own instances"
  ON instances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own instances"
  ON instances FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own instances"
  ON instances FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================
-- 3. TABLA PRODUCTS (Planes - Opcional)
-- ========================================
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  fields JSONB,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Política pública de lectura para productos
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  USING (active = TRUE);

-- ========================================
-- 4. STORAGE BUCKET para imágenes SPAM
-- ========================================
-- Crear bucket público para imágenes
INSERT INTO storage.buckets (id, name, public)
VALUES ('public-files', 'public-files', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage
CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'public-files');

CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'public-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'public-files' AND auth.uid()::text = owner);

CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'public-files' AND auth.uid()::text = owner);

-- ========================================
-- 5. FUNCIONES ÚTILES
-- ========================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para instances
DROP TRIGGER IF EXISTS update_instances_updated_at ON instances;
CREATE TRIGGER update_instances_updated_at
    BEFORE UPDATE ON instances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 6. DATOS DE EJEMPLO (Opcional)
-- ========================================

-- Insertar planes de ejemplo
INSERT INTO products (name, description, price, fields, active) VALUES
('Plan Free', 'Plan gratuito con funciones básicas', 0.00, '{"max_instances": 1, "max_contacts": 100}', true),
('Plan Basic', 'Plan básico para pequeños negocios', 9.99, '{"max_instances": 3, "max_contacts": 500}', true),
('Plan Pro', 'Plan profesional con todas las funciones', 29.99, '{"max_instances": 10, "max_contacts": 5000}', true)
ON CONFLICT DO NOTHING;

-- ========================================
-- ✅ SCRIPT COMPLETADO
-- ========================================
-- Verifica que todas las tablas se crearon:
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Verifica las políticas RLS:
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';
