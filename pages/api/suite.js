import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@/utils/supabase/api';
import axios from 'axios';

export default async function handler(req, res) {
  const { method, body } = req;

  try {
    // Inicializar cliente de Supabase para API
    const supabase = createClient(req, res);

    // Obtener el usuario autenticado directamente desde Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: 'No autorizado - Inicia sesión con Supabase' });
    }

    const userId = user.id;

    if (method === 'GET') {
      // Obtener instancias de Suite del usuario desde Supabase
      const { data: suites, error } = await supabaseAdmin
        .from('suites')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching suites:', error);
        return res.status(500).json({ error: error.message });
      }

      // Formatear respuesta para mantener compatibilidad con frontend
      return res.status(200).json([{
        suites: suites || []
      }]);



    } else if (method === 'POST') {
      // Crear nueva instancia de Suite
      const { service_name, service_url, product_name } = body;

      if (!service_name) {
        return res.status(400).json({ error: 'Falta service_name' });
      }

      // Verificar si ya existe
      const { data: existing } = await supabaseAdmin
        .from('suites')
        .select('id')
        .eq('user_id', userId)
        .eq('name', service_name)
        .single();

      if (existing) {
        return res.status(400).json({
          error: 'Ya existe una instancia con ese nombre'
        });
      }

      // Generar URL con dominio de Easypanel
      const baseDomain = process.env.EASYPANEL_BASE_DOMAIN || 'ld4pxg.easypanel.host';
      const generatedUrl = service_url || `https://${service_name}.${baseDomain}`;

      // Crear nueva instancia
      const { data: newSuite, error: insertError } = await supabaseAdmin
        .from('suites')
        .insert({
          user_id: userId,
          name: service_name,
          url: generatedUrl,
          activo: false,
          credencials: {
            product: product_name || 'N8N',
            created_by: user.email,
            mode: 'development',
            note: 'Instancia en modo desarrollo - contenedor Docker no creado aún',
          },
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating suite:', insertError);
        return res.status(500).json({ error: insertError.message });
      }

      return res.status(201).json({
        success: true,
        message: 'Instancia creada exitosamente',
        suite: newSuite,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({
      error: error.message || 'Internal Server Error',
    });
  }
}