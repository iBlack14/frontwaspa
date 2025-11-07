import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getCacheStats } from '../../../src/lib/spam-control';

/**
 * Endpoint para obtener estadísticas del cache
 * Solo accesible por administradores
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Verificar sesión
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.id) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    // TODO: Verificar que el usuario sea admin
    // const { data: profile } = await supabaseAdmin
    //   .from('profiles')
    //   .select('is_admin')
    //   .eq('id', session.id)
    //   .single();
    // 
    // if (!profile?.is_admin) {
    //   return res.status(403).json({ error: 'Solo administradores' });
    // }

    // Obtener estadísticas del cache
    const stats = getCacheStats();

    // Información del sistema
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    };

    return res.status(200).json({
      success: true,
      cache: stats,
      system: systemInfo,
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message,
    });
  }
}
