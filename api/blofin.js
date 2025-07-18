// api/blofin.js
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const BLOFIN_API_KEY = process.env.API_KEY;
const BLOFIN_SECRET_KEY = process.env.API_SECRET;
const BLOFIN_PASSPHRASE = process.env.PASSPHRASE;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

const ENDPOINT = '/api/v1/trade/fills?limit=50';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = req.headers['x-access-token'];
  if (!token || token !== ACCESS_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing token' });
  }

  try {
    const timestamp = Date.now().toString();
    const nonce = uuidv4();
    const method = 'GET';
    const body = '';
    const path = ENDPOINT;

    const prehash = `${path}${method}${timestamp}${nonce}${body}`;
    const hmac = crypto.createHmac('sha256', BLOFIN_SECRET_KEY);
    hmac.update(prehash);
    const signature = Buffer.from(hmac.digest('hex')).toString('base64');

    const response = await fetch(`https://api.blofin.com${ENDPOINT}`, {
      method,
      headers: {
        'ACCESS-KEY': BLOFIN_API_KEY,
        'ACCESS-SIGN': signature,
        'ACCESS-TIMESTAMP': timestamp,
        'ACCESS-NONCE': nonce,
        'ACCESS-PASSPHRASE': BLOFIN_PASSPHRASE,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Blofin error', details: data });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Proxy request failed', details: err.message });
  }
}

