import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar sesión
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.id) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const { service_name, service_url, product_name, plan } = req.body;

    // Validaciones
    if (!service_name) {
      return res.status(400).json({ error: 'Falta service_name' });
    }

    if (!plan) {
      return res.status(400).json({ error: 'Debes seleccionar un plan' });
    }

    // Validar nombre del servicio
    if (/[A-Z]/.test(service_name)) {
      return res.status(400).json({ error: 'El nombre del servicio no debe contener mayúsculas' });
    }

    if (service_name.trim() === 'n8n_free_treal') {
      return res.status(400).json({ error: 'El nombre "n8n_free_treal" está reservado' });
    }

    if (service_name.length < 3) {
      return res.status(400).json({ error: 'El nombre debe tener al menos 3 caracteres' });
    }

    // Verificar si ya existe una instancia con ese nombre
    const { data: existing } = await supabaseAdmin
      .from('suites')
      .select('id')
      .eq('user_id', session.id)
      .eq('name', service_name)
      .single();

    if (existing) {
      return res.status(400).json({ 
        error: 'Ya existe una instancia con ese nombre' 
      });
    }

    // Configuración de recursos según el plan
    const planConfigs = {
      free: {
        memory: '256M',
        cpu: 256,
        description: 'Plan Free - 256MB RAM, 256 CPU'
      },
      basic: {
        memory: '512M',
        cpu: 512,
        description: 'Plan Basic - 512MB RAM, 512 CPU'
      },
      premium: {
        memory: '1G',
        cpu: 1024,
        description: 'Plan Premium - 1GB RAM, 1024 CPU'
      },
      pro: {
        memory: '2G',
        cpu: 2048,
        description: 'Plan Pro - 2GB RAM, 2048 CPU'
      }
    };

    const selectedPlanConfig = planConfigs[plan] || planConfigs.free;

    // Generar URL con dominio de Easypanel
    const baseDomain = process.env.EASYPANEL_BASE_DOMAIN || '1mrj9n.easypanel.host';
    const generatedUrl = service_url || `https://${service_name}.${baseDomain}`;

    // Crear credenciales con información del plan
    const credentials = {
      product: product_name || 'N8N',
      plan: plan,
      memory: selectedPlanConfig.memory,
      cpu: selectedPlanConfig.cpu,
      description: selectedPlanConfig.description,
      created_by: session.email || session.user?.email,
      created_at: new Date().toISOString(),
      status: 'pending',
      note: 'Instancia creada - En espera de aprovisionamiento'
    };

    // Crear nueva instancia en Supabase
    const { data: newSuite, error: insertError } = await supabaseAdmin
      .from('suites')
      .insert({
        user_id: session.id,
        name: service_name,
        url: generatedUrl,
        activo: false,
        credencials: credentials,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating suite:', insertError);
      return res.status(500).json({ error: insertError.message });
    }

    // Llamar al backend para crear el contenedor Docker
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    let dockerCredentials = null;

    if (!backendUrl) {
      console.error('❌ NEXT_PUBLIC_BACKEND_URL no está configurado');
      return res.status(500).json({
        error: 'Configuración incompleta: NEXT_PUBLIC_BACKEND_URL no está definido',
        suite_created: true,
        suite_id: newSuite.id,
        note: 'La instancia fue registrada pero no se pudo crear el contenedor Docker'
      });
    }

    if (backendUrl) {
      try {
        console.log('🚀 Calling backend to create N8N instance...');
        console.log('Backend URL:', backendUrl);
        console.log('Service Name:', service_name);
        console.log('Plan:', plan);
        
        // ✅ Obtener API key del usuario
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('api_key')
          .eq('id', session.id)
          .single();

        if (!profile || !profile.api_key) {
          return res.status(403).json({
            error: 'API Key requerida',
            message: 'Para crear instancias N8N debes generar tu API Key en tu perfil. Ve a Profile → API Key → Generar',
            suite_created: true,
            suite_id: newSuite.id
          });
        }
        
        const dockerResponse = await axios.post(
          `${backendUrl}/api/suite/create-n8n`,
          {
            service_name: service_name,
            user_id: session.id,
            memory: selectedPlanConfig.memory,
            cpu: selectedPlanConfig.cpu,
            plan: plan
          },
          {
            timeout: 120000, // Aumentado a 2 minutos
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${profile.api_key}` // ✅ Agregar API key
            }
          }
        );

        if (dockerResponse.data.success) {
          dockerCredentials = dockerResponse.data.credentials;
          const healthCheckPassed = dockerResponse.data.credentials?.health_check_passed || false;

          // Actualizar con las credenciales reales del contenedor
          await supabaseAdmin
            .from('suites')
            .update({
              activo: healthCheckPassed, // Solo marcar como activo si el health check pasó
              credencials: {
                ...credentials,
                ...dockerCredentials,
                container_id: dockerResponse.data.container_id,
                status: healthCheckPassed ? 'running' : 'initializing',
                note: healthCheckPassed
                  ? 'Contenedor Docker creado y N8N listo para usar'
                  : 'Contenedor Docker creado. N8N se está inicializando (puede tomar unos minutos).'
              }
            })
            .eq('id', newSuite.id);

          console.log('N8N instance created successfully');
        }

      } catch (dockerError) {
        console.error('❌ Docker API call failed:', {
          message: dockerError.message,
          code: dockerError.code,
          response_status: dockerError.response?.status,
          response_data: dockerError.response?.data,
          backend_url: backendUrl,
          service_name: service_name
        });
        
        // Determinar tipo de error
        let errorType = 'UNKNOWN';
        let userMessage = dockerError.message;
        
        if (dockerError.code === 'ECONNREFUSED') {
          errorType = 'CONNECTION_REFUSED';
          userMessage = 'No se pudo conectar al backend. Verifica que esté corriendo.';
        } else if (dockerError.code === 'ETIMEDOUT' || dockerError.message.includes('timeout')) {
          errorType = 'TIMEOUT';
          userMessage = 'El backend tardó demasiado en responder. Intenta nuevamente.';
        } else if (dockerError.code === 'ENOTFOUND') {
          errorType = 'DNS_ERROR';
          userMessage = 'No se pudo encontrar el backend. Verifica la URL.';
        } else if (dockerError.response?.status === 500) {
          errorType = 'BACKEND_ERROR';
          userMessage = dockerError.response?.data?.error || 'Error interno del backend';
        }
        
        // Actualizar con error pero no fallar la creación
        await supabaseAdmin
          .from('suites')
          .update({
            credencials: {
              ...credentials,
              status: 'error',
              error: userMessage,
              error_type: errorType,
              error_details: dockerError.response?.data || dockerError.message,
              note: 'Error al crear contenedor Docker - Instancia registrada pero no activa'
            }
          })
          .eq('id', newSuite.id);

        // Retornar error específico con mejor mensaje
        return res.status(500).json({
          error: userMessage,
          error_type: errorType,
          details: dockerError.response?.data || dockerError.message,
          suite_created: true,
          suite_id: newSuite.id,
          backend_url: backendUrl,
          help: 'Verifica los logs del backend y que NEXT_PUBLIC_BACKEND_URL sea correcto'
        });
      }
    } else {
      console.warn('NEXT_PUBLIC_BACKEND_URL not configured - instance created in database only');
    }

    // Determinar el mensaje basado en si el health check pasó
    const healthCheckPassed = dockerCredentials?.health_check_passed || false;
    const message = healthCheckPassed
      ? `Instancia de N8N creada exitosamente con plan ${plan.toUpperCase()}`
      : `Instancia de N8N creada con plan ${plan.toUpperCase()}. N8N se está inicializando y puede tomar unos minutos estar listo.`;

    return res.status(201).json({
      success: true,
      message: message,
      suite: newSuite,
      plan_config: selectedPlanConfig,
      health_check_passed: healthCheckPassed,
      note: healthCheckPassed
        ? 'Tu instancia N8N está lista para usar.'
        : 'Espera unos minutos y refresca la página. N8N necesita inicializar su base de datos.'
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({
      error: error.message || 'Internal Server Error',
    });
  }
}
