import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { clientId } = req.body;
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token || !clientId) {
    return res.status(400).json({ error: 'Missing token or clientId' });
  }

  try {
    const response = await axios.post(
      `${process.env.BACKEND_URL}/api/generate-qr`,
      { clientId },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error generating QR:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Internal Server Error',
    });
  }
}