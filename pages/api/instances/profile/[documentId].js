import axios from 'axios';

export default async function handler(req, res) {
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL; // Server-side env variable

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }




  const { documentId } = req.query;

  // Validar que documentId exista
  if (!documentId || documentId === 'undefined') {
    return res.status(400).json({ 
      error: 'documentId is required and cannot be undefined' 
    });
  }

  try {
    const response = await axios.get(
      `${BACKEND_URL}/api/profile/${documentId}`,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000, // 5 segundos máximo
      }
    );
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching profile:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Internal Server Error',
    });
  }
}