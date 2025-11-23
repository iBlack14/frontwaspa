import { supabaseAdmin } from '@/lib/supabase-admin'
import axios from 'axios';

export default async function handler(req, res) {
  const { method, headers, body, query } = req;
  const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL; // Server-side env variable
  const token_read = process.env.NEXT_PUBLIC_BACKEND_READ_TOKEN; // Server-side env variable
  const weebhook = process.env.NEXT_PUBLIC_N8N_WORKSPACE;
  const weebhook_info = process.env.INFO_SERVICE_WEBHOOK;

  try {
    if (method === 'GET') {
      // Obtener productos desde Supabase
      const { data: products, error } = await supabaseAdmin
        .from('products')
        .select('*')

      // Si hay error, devolver array vacío o manejarlo. 
      // Si products es null, inicializarlo como array vacío para el check de abajo.
      let finalProducts = products || [];

      if (error) {
        console.warn('Error fetching products from database:', error);
      }

      // Verificar si N8N ya existe en los productos (case insensitive)
      const n8nExists = finalProducts.some(p => p.name && p.name.toLowerCase() === 'n8n');

      // Si no existe, agregarlo
      if (!n8nExists) {
        finalProducts.push({
          id: 999, // ID temporal/ficticio para el frontend
          name: 'N8N',
          fields: [
            {
              service_name: ''
            }
          ],
          img: ['https://n8n.io/favicon.ico'], // Array como espera el map de abajo
          price: '0',
          description: 'Plataforma de automatización de flujos de trabajo'
        });
      }

      // Formatear respuesta
      const payload = finalProducts.map((item) => ({
        id: item.id,
        name: item.name,
        fields: item.fields,
        // Manejar tanto array (Supabase) como string (Hardcoded) si fuera necesario
        img: Array.isArray(item.img) && item.img.length > 0 ? item.img[0] : (typeof item.img === 'string' ? item.img : null),
        price: item.price,
        description: item.description
      }));

      return res.status(200).json(payload);

    } else if (method === 'POST') {
      // Create new instance
      const response = await axios.post(
        weebhook_info,
        body,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const { success, message } = response.data;

      if (success) {
        return res.status(200).json({ message });
      } else {
        return res.status(400).json({ message });
      }

    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API error:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Internal Server Error',
    });
  }
}