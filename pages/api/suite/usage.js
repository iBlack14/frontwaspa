import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name_service } = req.body;

    if (!name_service) {
      return res.status(400).json({ error: 'name_service is required' });
    }

    // Llamar al backend para obtener métricas
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    
    if (!backendUrl) {
      return res.status(500).json({ error: 'Backend URL not configured' });
    }

    const response = await axios.post(
      `${backendUrl}/api/suite/usage`,
      { name_service },
      {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    return res.status(200).json(response.data);

  } catch (error) {
    console.error('Error fetching resource usage:', error.message);
    return res.status(500).json({
      error: error.response?.data?.error || error.message || 'Error al obtener métricas',
    });
  }
}
