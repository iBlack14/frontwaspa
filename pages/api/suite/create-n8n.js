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

    if (backendUrl) {
      try {
        console.log('Calling backend to create N8N instance...');
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
            timeout: 30000,
            headers: { 'Content-Type': 'application/json' }
          }
        );

        if (dockerResponse.data.success) {
          dockerCredentials = dockerResponse.data.credentials;
          
          // Actualizar con las credenciales reales del contenedor
          await supabaseAdmin
            .from('suites')
            .update({
              activo: true,
              credencials: {
                ...credentials,
                ...dockerCredentials,
                container_id: dockerResponse.data.container_id,
                status: 'running',
                note: 'Contenedor Docker creado y en ejecución'
              }
            })
            .eq('id', newSuite.id);

          console.log('N8N instance created successfully');
        }

      } catch (dockerError) {
        console.error('Docker API call failed:', dockerError.message);
        
        // Actualizar con error pero no fallar la creación
        await supabaseAdmin
          .from('suites')
          .update({
            credencials: {
              ...credentials,
              status: 'error',
              error: dockerError.message,
              note: 'Error al crear contenedor Docker - Instancia registrada pero no activa'
            }
          })
          .eq('id', newSuite.id);

        // Retornar error específico con mejor mensaje
        const errorMessage = dockerError.response?.data?.error || dockerError.message;
        return res.status(500).json({
          error: errorMessage,
          details: dockerError.response?.data || dockerError.message,
          suite_created: true,
          suite_id: newSuite.id
        });
      }
    } else {
      console.warn('NEXT_PUBLIC_BACKEND_URL not configured - instance created in database only');
    }

    return res.status(201).json({
      success: true,
      message: `Instancia de N8N creada exitosamente con plan ${plan.toUpperCase()}`,
      suite: newSuite,
      plan_config: selectedPlanConfig
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({
      error: error.message || 'Internal Server Error',
    });
  }
}
