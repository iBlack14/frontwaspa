import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { 
  stopSpam, 
  getSpamStatus, 
  getUserSpams,
  cleanupSpam 
} from '../../../src/lib/spam-control';

export default async function handler(req, res) {
  try {
    // Verificar sesión
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.id) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const { method } = req;

    // GET - Obtener estado de envío(s)
    if (method === 'GET') {
      const { spamId } = req.query;

      if (spamId) {
        // Obtener estado de un envío específico
        console.log('[SPAM-CONTROL] Buscando spam:', spamId);
        const status = getSpamStatus(spamId);
        
        console.log('[SPAM-CONTROL] Estado encontrado:', status ? 'Sí' : 'No');
        
        if (!status) {
          console.warn('[SPAM-CONTROL] ⚠️ Envío no encontrado en memoria:', spamId);
          return res.status(404).json({ error: 'Envío no encontrado' });
        }

        // Verificar que pertenece al usuario
        if (status.userId !== session.id) {
          return res.status(403).json({ error: 'No autorizado' });
        }

        console.log('[SPAM-CONTROL] ✅ Retornando estado:', {
          current: status.currentContact,
          total: status.totalContacts,
          completed: status.completed,
          stopped: status.stopped
        });

        return res.json({ status });
      } else {
        // Obtener todos los envíos del usuario
        const userSpams = getUserSpams(session.id);
        return res.json({ spams: userSpams });
      }
    }

    // POST - Detener un envío
    if (method === 'POST') {
      const { action, spamId } = req.body;

      if (!spamId) {
        return res.status(400).json({ error: 'spamId es requerido' });
      }

      const status = getSpamStatus(spamId);
      
      if (!status) {
        return res.status(404).json({ error: 'Envío no encontrado' });
      }

      // Verificar que pertenece al usuario
      if (status.userId !== session.id) {
        return res.status(403).json({ error: 'No autorizado' });
      }

      if (action === 'stop') {
        stopSpam(spamId);
        return res.json({ 
          success: true, 
          message: 'Envío detenido',
          status: getSpamStatus(spamId)
        });
      }

      if (action === 'cleanup') {
        cleanupSpam(spamId);
        return res.json({ 
          success: true, 
          message: 'Envío limpiado'
        });
      }

      return res.status(400).json({ error: 'Acción no válida' });
    }

    // DELETE - Limpiar un envío
    if (method === 'DELETE') {
      const { spamId } = req.query;

      if (!spamId) {
        return res.status(400).json({ error: 'spamId es requerido' });
      }

      const status = getSpamStatus(spamId);
      
      if (status && status.userId !== session.id) {
        return res.status(403).json({ error: 'No autorizado' });
      }

      cleanupSpam(spamId);
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    console.error('Error in spam-control:', error);
    res.status(500).json({ error: error.message });
  }
}
