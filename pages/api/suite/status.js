import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@/utils/supabase/api';
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Inicializar cliente de Supabase para API
    const supabase = createClient(req, res);

    // Obtener el usuario autenticado directamente desde Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const userId = user.id;

    const { name_service } = req.body;

    if (!name_service) {
      return res.status(400).json({ error: 'Falta name_service' });
    }

    // Buscar la instancia
    const { data: suite, error } = await supabaseAdmin
      .from('suites')
      .select('*')
      .eq('user_id', userId)
      .eq('name', name_service)
      .single();

    if (error || !suite) {
      return res.status(404).json({ error: 'Instancia no encontrada' });
    }

    // Si ya está activo, devolver estado activo
    if (suite.activo) {
      return res.status(200).json({
        status: 'running',
        message: 'Instancia ya está activa',
        instance_ready: true
      });
    }

    // Si está en error, devolver error
    if (suite.credencials?.status === 'error') {
      return res.status(200).json({
        status: 'error',
        message: suite.credencials?.error || 'Error en la instancia',
        instance_ready: false
      });
    }

    // Verificar con el backend el estado real del contenedor
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) {
      return res.status(500).json({
        error: 'Backend URL not configured',
        instance_ready: false
      });
    }

    // Obtener API key del usuario
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('api_key')
      .eq('id', userId)
      .single();

    if (!profile || !profile.api_key) {
      return res.status(403).json({
        error: 'API Key requerida',
        message: 'Para verificar el estado necesitas tu API Key generada en tu perfil.'
      });
    }

    try {
      // Consultar estado del contenedor al backend
      const backendResponse = await axios.post(
        `${backendUrl}/api/suite/status`,
        { name_service },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${profile.api_key}`
          }
        }
      );

      const containerStatus = backendResponse.data;

      // Si el contenedor está corriendo, verificar si n8n está listo
      if (containerStatus.status === 'running') {
        // Intentar verificar si n8n está respondiendo correctamente
        try {
          const n8nResponse = await axios.get(suite.url, {
            timeout: 5000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; SuiteStatusChecker/1.0)'
            },
            validateStatus: function (status) {
              return status < 500; // Aceptar cualquier status menor a 500
            }
          });

          // Si n8n responde con 200, está listo
          if (n8nResponse.status === 200) {
            // Actualizar estado en base de datos
            await supabaseAdmin
              .from('suites')
              .update({
                activo: true,
                credencials: {
                  ...suite.credencials,
                  status: 'running',
                  n8n_ready: true,
                  last_checked: new Date().toISOString()
                }
              })
              .eq('id', suite.id);

            return res.status(200).json({
              status: 'running',
              message: 'N8N está listo y funcionando',
              instance_ready: true,
              n8n_ready: true
            });
          } else if (n8nResponse.status === 404) {
            // 404 es normal durante inicialización de n8n
            return res.status(200).json({
              status: 'initializing',
              message: 'Contenedor corriendo, N8N inicializando base de datos (404 normal)',
              instance_ready: false,
              n8n_ready: false,
              note: 'N8N está inicializando. El 404 es normal al inicio.'
            });
          } else {
            return res.status(200).json({
              status: 'initializing',
              message: `Contenedor corriendo, N8N respondiendo con status ${n8nResponse.status}`,
              instance_ready: false,
              n8n_ready: false
            });
          }
        } catch (n8nError) {
          // Error de conexión a n8n
          if (n8nError.code === 'ECONNREFUSED') {
            return res.status(200).json({
              status: 'starting',
              message: 'Contenedor corriendo pero N8N aún no está aceptando conexiones',
              instance_ready: false,
              n8n_ready: false
            });
          } else if (n8nError.code === 'ENOTFOUND') {
            return res.status(200).json({
              status: 'dns_error',
              message: 'Error de DNS - posible problema de routing en Easypanel',
              instance_ready: false,
              n8n_ready: false,
              note: 'Verificar configuración DNS y routing en Easypanel'
            });
          } else {
            return res.status(200).json({
              status: 'initializing',
              message: `Contenedor corriendo, esperando que N8N esté listo: ${n8nError.message}`,
              instance_ready: false,
              n8n_ready: false
            });
          }
        }
      } else {
        // Contenedor no está corriendo
        return res.status(200).json({
          status: containerStatus.status || 'stopped',
          message: containerStatus.message || 'Contenedor no está corriendo',
          instance_ready: false,
          n8n_ready: false
        });
      }

    } catch (backendError) {
      console.error('Backend status check failed:', backendError.message);

      // Si el backend no responde, intentar verificar directamente la URL
      try {
        const directResponse = await axios.get(suite.url, {
          timeout: 5000,
          validateStatus: function (status) {
            return status < 500;
          }
        });

        if (directResponse.status === 200) {
          await supabaseAdmin
            .from('suites')
            .update({
              activo: true,
              credencials: {
                ...suite.credencials,
                status: 'running',
                n8n_ready: true,
                last_checked: new Date().toISOString()
              }
            })
            .eq('id', suite.id);

          return res.status(200).json({
            status: 'running',
            message: 'N8N está listo (verificación directa)',
            instance_ready: true,
            n8n_ready: true
          });
        } else {
          return res.status(200).json({
            status: 'initializing',
            message: `Status ${directResponse.status} - N8N inicializando`,
            instance_ready: false,
            n8n_ready: false
          });
        }
      } catch (directError) {
        return res.status(200).json({
          status: 'backend_unavailable',
          message: 'No se pudo verificar con backend, intentando verificación directa',
          instance_ready: false,
          n8n_ready: false,
          backend_error: backendError.message,
          direct_check_error: directError.message
        });
      }
    }

  } catch (error) {
    console.error('Status check error:', error);
    return res.status(500).json({
      error: error.message || 'Internal Server Error',
      instance_ready: false
    });
  }
}