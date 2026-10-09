export default async function handler(req, res) {
  const supabaseUrl = 'https://yhbhgvrwuhxtebvqxggi.supabase.co';
  
  // Extract target path
  const path = req.url.replace(/^\/api\/proxy/, '');
  const targetUrl = `${supabaseUrl}${path}`;

  try {
    // Only forward essential safe headers to prevent TLS handshake failure
    const forwardHeaders = {
      'host': 'yhbhgvrwuhxtebvqxggi.supabase.co',
      'accept': req.headers['accept'] || '*/*',
      'user-agent': 'Vercel-Proxy',
    };

    if (req.headers['authorization']) forwardHeaders['authorization'] = req.headers['authorization'];
    if (req.headers['apikey']) forwardHeaders['apikey'] = req.headers['apikey'];
    if (req.headers['content-type']) forwardHeaders['content-type'] = req.headers['content-type'];

    const fetchOptions = {
      method: req.method,
      headers: forwardHeaders,
      redirect: 'manual', // DO NOT auto-follow; let Supabase send 302 directly to browser
    };

    if (!['GET', 'HEAD'].includes(req.method) && req.body) {
      fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);

    // Pass the Google OAuth redirect back to the user's browser
    const location = response.headers.get('location');
    if (location) {
      return res.redirect(response.status || 302, location);
    }

    const data = await response.arrayBuffer();
    const contentType = response.headers.get('content-type');
    if (contentType) res.setHeader('content-type', contentType);

    res.status(response.status).send(Buffer.from(data));
  } catch (error) {
    res.status(500).json({ error: 'Proxy Request Failed', details: error.message });
  }
}