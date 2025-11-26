import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar sesión
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { instanceId, q } = req.query;

    if (!instanceId || !q) {
      return res.status(400).json({ error: 'instanceId and q are required' });
    }

    // Hacer request al backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.connect.blxkstudio.com';
    const response = await fetch(
      `${backendUrl}/api/contacts/search/${instanceId}?q=${encodeURIComponent(q as string)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // No enviamos API Key por ahora, vamos a modificar el backend
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Error searching contacts:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
