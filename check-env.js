#!/usr/bin/env node

/**
 * Script para verificar variables de entorno
 * Ejecutar con: node check-env.js
 */

const requiredVars = [
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_KEY',
  'BACKEND_URL',
];

const optionalVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'NEXT_PUBLIC_N8N_WEBHOOK_URL',
  'NEXT_PUBLIC_BACKEND_READ_TOKEN',
];

console.log('🔍 Verificando variables de entorno...\n');

let hasErrors = false;
let missingRequired = [];
let missingOptional = [];

// Verificar variables requeridas
console.log('✅ VARIABLES REQUERIDAS:');
requiredVars.forEach((varName) => {
  const value = process.env[varName];
  if (value) {
    const preview = value.length > 30 ? value.substring(0, 30) + '...' : value;
    console.log(`  ✓ ${varName}: ${preview}`);
  } else {
    console.log(`  ✗ ${varName}: ❌ FALTANTE`);
    hasErrors = true;
    missingRequired.push(varName);
  }
});

// Verificar variables opcionales
console.log('\n📋 VARIABLES OPCIONALES:');
optionalVars.forEach((varName) => {
  const value = process.env[varName];
  if (value) {
    const preview = value.length > 30 ? value.substring(0, 30) + '...' : value;
    console.log(`  ✓ ${varName}: ${preview}`);
  } else {
    console.log(`  - ${varName}: (no configurada)`);
    missingOptional.push(varName);
  }
});

// Validaciones específicas
console.log('\n🔧 VALIDACIONES:');

// Validar NEXTAUTH_URL
if (process.env.NEXTAUTH_URL) {
  if (process.env.NEXTAUTH_URL.startsWith('http://localhost')) {
    console.log('  ⚠️  NEXTAUTH_URL usa localhost (OK para desarrollo)');
  } else if (process.env.NEXTAUTH_URL.startsWith('https://')) {
    console.log('  ✓ NEXTAUTH_URL usa HTTPS (correcto para producción)');
  } else {
    console.log('  ✗ NEXTAUTH_URL debe empezar con http:// o https://');
    hasErrors = true;
  }
}

// Validar NEXTAUTH_SECRET longitud
if (process.env.NEXTAUTH_SECRET) {
  if (process.env.NEXTAUTH_SECRET.length < 32) {
    console.log('  ⚠️  NEXTAUTH_SECRET es muy corto (recomendado: 32+ caracteres)');
  } else {
    console.log('  ✓ NEXTAUTH_SECRET tiene longitud adecuada');
  }
}

// Validar Supabase URL
if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL.includes('supabase.co')) {
    console.log('  ✓ NEXT_PUBLIC_SUPABASE_URL parece válida');
  } else {
    console.log('  ⚠️  NEXT_PUBLIC_SUPABASE_URL no parece una URL de Supabase');
  }
}

// Validar Supabase Keys formato JWT
if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.startsWith('eyJ')) {
    console.log('  ✓ NEXT_PUBLIC_SUPABASE_ANON_KEY tiene formato JWT correcto');
  } else {
    console.log('  ✗ NEXT_PUBLIC_SUPABASE_ANON_KEY no tiene formato JWT válido');
    hasErrors = true;
  }
}

if (process.env.SUPABASE_SERVICE_KEY) {
  if (process.env.SUPABASE_SERVICE_KEY.startsWith('eyJ')) {
    console.log('  ✓ SUPABASE_SERVICE_KEY tiene formato JWT correcto');
  } else {
    console.log('  ✗ SUPABASE_SERVICE_KEY no tiene formato JWT válido');
    hasErrors = true;
  }
}

// Resumen
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ HAY ERRORES - NO DESPLEGAR A PRODUCCIÓN\n');
  
  if (missingRequired.length > 0) {
    console.log('Variables requeridas faltantes:');
    missingRequired.forEach(v => console.log(`  - ${v}`));
  }
  
  console.log('\n💡 Cómo obtener las variables:');
  console.log('1. NEXTAUTH_SECRET: openssl rand -base64 32');
  console.log('2. Supabase keys: https://app.supabase.com → Settings → API');
  console.log('3. NEXTAUTH_URL: Tu dominio completo (https://...)');
  console.log('4. BACKEND_URL: URL de tu backend API');
  
  process.exit(1);
} else {
  console.log('✅ TODAS LAS VARIABLES REQUERIDAS ESTÁN CONFIGURADAS\n');
  
  if (missingOptional.length > 0) {
    console.log('⚠️  Variables opcionales no configuradas:');
    missingOptional.forEach(v => console.log(`  - ${v}`));
    console.log('\n(Esto es OK si no las necesitas)\n');
  }
  
  console.log('🚀 Listo para desplegar a producción!');
  process.exit(0);
}
