import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * Cron job para limpiezas automáticas
 * Ejecutar cada hora con Vercel Cron o similar
 * 
 * Vercel cron config (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/cleanup",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 */
export default async function handler(req, res) {
  // Verificar que es una llamada de cron (opcional: agregar auth token)
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const results = {
      timestamp: new Date().toISOString(),
      tasks: [],
    };

    // 1. Limpiar instancias inactivas (> 24 horas)
    try {
      const { data: inactiveCount, error: inactiveError } = await supabaseAdmin
        .rpc('cleanup_inactive_instances');

      if (inactiveError) throw inactiveError;

      results.tasks.push({
        name: 'cleanup_inactive_instances',
        success: true,
        deleted: inactiveCount,
      });

      console.log(`[CRON] ✅ Instancias inactivas eliminadas: ${inactiveCount}`);
    } catch (error) {
      console.error('[CRON] Error limpiando instancias:', error);
      results.tasks.push({
        name: 'cleanup_inactive_instances',
        success: false,
        error: error.message,
      });
    }

    // 2. Limpiar rate limits antiguos (> 7 días)
    try {
      const { data: rateLimitCount, error: rateLimitError } = await supabaseAdmin
        .rpc('cleanup_old_rate_limits');

      if (rateLimitError) throw rateLimitError;

      results.tasks.push({
        name: 'cleanup_old_rate_limits',
        success: true,
        deleted: rateLimitCount,
      });

      console.log(`[CRON] ✅ Rate limits antiguos eliminados: ${rateLimitCount}`);
    } catch (error) {
      console.error('[CRON] Error limpiando rate limits:', error);
      results.tasks.push({
        name: 'cleanup_old_rate_limits',
        success: false,
        error: error.message,
      });
    }

    // 3. Limpiar spam_progress completados (> 24 horas)
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { error: spamError, count } = await supabaseAdmin
        .from('spam_progress')
        .delete()
        .lt('started_at', oneDayAgo)
        .eq('completed', true);

      if (spamError) throw spamError;

      results.tasks.push({
        name: 'cleanup_spam_progress',
        success: true,
        deleted: count || 0,
      });

      console.log(`[CRON] ✅ Spam progress eliminados: ${count || 0}`);
    } catch (error) {
      console.error('[CRON] Error limpiando spam progress:', error);
      results.tasks.push({
        name: 'cleanup_spam_progress',
        success: false,
        error: error.message,
      });
    }

    // 4. Limpiar chatbot_logs antiguos (> 30 días)
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const { error: logsError, count } = await supabaseAdmin
        .from('chatbot_logs')
        .delete()
        .lt('timestamp', thirtyDaysAgo);

      if (logsError) throw logsError;

      results.tasks.push({
        name: 'cleanup_chatbot_logs',
        success: true,
        deleted: count || 0,
      });

      console.log(`[CRON] ✅ Chatbot logs eliminados: ${count || 0}`);
    } catch (error) {
      console.error('[CRON] Error limpiando chatbot logs:', error);
      results.tasks.push({
        name: 'cleanup_chatbot_logs',
        success: false,
        error: error.message,
      });
    }

    // 5. Vacuum y analyze (optimización de BD)
    try {
      // Nota: VACUUM no se puede ejecutar desde una transacción
      // Esto es solo para logging
      results.tasks.push({
        name: 'database_optimization',
        success: true,
        message: 'Ejecutar VACUUM ANALYZE manualmente en Supabase SQL Editor',
      });
    } catch (error) {
      console.error('[CRON] Error en optimización:', error);
    }

    // Resumen
    const successCount = results.tasks.filter(t => t.success).length;
    const totalTasks = results.tasks.length;

    console.log(`[CRON] 📊 Resumen: ${successCount}/${totalTasks} tareas exitosas`);

    return res.status(200).json({
      success: true,
      message: `Limpieza completada: ${successCount}/${totalTasks} tareas exitosas`,
      results,
    });
  } catch (error) {
    console.error('[CRON] Error fatal:', error);
    return res.status(500).json({
      success: false,
      error: 'Error en limpieza automática',
      details: error.message,
    });
  }
}
