import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

const WOOCOMMERCE_URL = process.env.NEXT_PUBLIC_WOOCOMMERCE_URL;
const CONSUMER_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET;

  try {
    if (method === 'GET') {
      // Fetch products from WooCommerce REST API
      const response = await fetch(`${WOOCOMMERCE_URL}?per_page=20`, {
        method: 'GET',
        headers: {
          Authorization: `Basic ${Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`WooCommerce API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('WooCommerce API error:', error.message);
    return res.status(error.response?.status || 500).json({
      error: error.message || 'Internal Server Error',
    });
  }
}