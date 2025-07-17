const axios = require('axios');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).end();

  const token = req.headers['x-access-token'];
  if (token !== process.env.ACCESS_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const timestamp = Date.now().toString();
    const nonce = uuidv4();
    const method = 'GET';
    const body = '';
    const path = '/api/v1/trade/fills?limit=50';

    const prehash = `${path}${method}${timestamp}${nonce}${body}`;
    const hmac = crypto.createHmac('sha256', process.env.API_SECRET);
    hmac.update(prehash);
    const hexSignature = hmac.digest('hex');
    const signature = Buffer.from(hexSignature, 'utf8').toString('base64');

    const headers = {
      'ACCESS-KEY': process.env.API_KEY,
      'ACCESS-SIGN': signature,
      'ACCESS-TIMESTAMP': timestamp,
      'ACCESS-NONCE': nonce,
      'ACCESS-PASSPHRASE': process.env.PASSPHRASE,
      'Content-Type': 'application/json'
    };

    const response = await axios.get(`https://api.blofin.com${path}`, { headers });
    return res.status(200).json(response.data);
  } catch (err) {
    return res.status(500).json({ error: 'Proxy error', details: err.response?.data || err.message });
  }
};
