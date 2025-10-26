import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.id) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const { name_service } = req.body;

    if (!name_service) {
      return res.status(400).json({ error: 'Falta name_service' });
    }

    // Buscar la instancia
    const { data: suite, error } = await supabaseAdmin
      .from('suites')
      .select('*')
      .eq('user_id', session.id)
      .eq('name', name_service)
      .single();

    if (error || !suite) {
      return res.status(404).json({ error: 'Instancia no encontrada' });
    }

    // Eliminar de la base de datos
    const { error: deleteError } = await supabaseAdmin
      .from('suites')
      .delete()
      .eq('id', suite.id);

    if (deleteError) {
      return res.status(500).json({ error: deleteError.message });
    }

    // Llamar al backend para eliminar el contenedor Docker
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (backendUrl) {
      try {
        await axios.post(`${backendUrl}/api/suite/delete`, {
          service_name: name_service,
          user_id: session.id
        }, { 
          timeout: 15000,
          headers: { 'Content-Type': 'application/json' }
        });
        console.log(`Container ${name_service} deleted successfully`);
      } catch (dockerError) {
        console.error('Docker delete failed:', dockerError.message);
        // No revertir la eliminación de la base de datos
        // pero informar del error
        return res.status(207).json({
          success: true,
          message: 'Instancia eliminada de la base de datos',
          warning: 'Error al eliminar el contenedor Docker',
          details: dockerError.message
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Instancia ${name_service} eliminada exitosamente`
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({
      error: error.message || 'Internal Server Error',
    });
  }
}
