import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  try {
    // Verificar sesión
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.id) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    if (req.method === 'GET') {
      // Obtener configuración de proxy
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('proxy_enabled, proxy_type, proxy_host, proxy_port, proxy_username, proxy_country, proxy_rotation, proxy_rotation_minutes')
        .eq('id', session.id)
        .single();

      if (error) {
        console.error('Error obteniendo config:', error);
        return res.status(500).json({ error: 'Error al obtener configuración' });
      }

      return res.json({
        success: true,
        config: data || {},
      });
    }

    if (req.method === 'PUT') {
      // Guardar configuración de proxy
      const {
        proxy_enabled,
        proxy_type,
        proxy_host,
        proxy_port,
        proxy_username,
        proxy_password,
        proxy_country,
        proxy_rotation,
        proxy_rotation_minutes,
      } = req.body;

      // Validaciones
      if (proxy_enabled) {
        if (!proxy_host || !proxy_host.trim()) {
          return res.status(400).json({ error: 'Host del proxy es requerido' });
        }
        if (!proxy_port || proxy_port < 1 || proxy_port > 65535) {
          return res.status(400).json({ error: 'Puerto debe estar entre 1 y 65535' });
        }
      }

      // Preparar datos a actualizar
      const updateData = {
        proxy_enabled: proxy_enabled || false,
        proxy_type: proxy_type || 'http',
        proxy_host: proxy_host || null,
        proxy_port: proxy_port || null,
        proxy_username: proxy_username || null,
        proxy_country: proxy_country || null,
        proxy_rotation: proxy_rotation || false,
        proxy_rotation_minutes: proxy_rotation_minutes || 30,
      };

      // Solo actualizar password si se proporcionó uno nuevo
      if (proxy_password && proxy_password.trim()) {
        updateData.proxy_password = proxy_password;
      }

      const { error } = await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('id', session.id);

      if (error) {
        console.error('Error guardando config:', error);
        return res.status(500).json({ error: 'Error al guardar configuración' });
      }

      return res.json({
        success: true,
        message: 'Configuración guardada exitosamente',
      });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    console.error('Error en proxy API:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
