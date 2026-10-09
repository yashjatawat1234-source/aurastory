export default async function handler(req, res) {
  const supabaseUrl = 'https://yhbhgvrwuhxtebvqxggi.supabase.co';
  
  // Strip '/api/proxy' prefix to extract the raw Supabase path
  const path = req.url.replace(/^\/api\/proxy/, '');
  const targetUrl = `${supabaseUrl}${path}`;

  try {
    const headers = {};
    if (req.headers['authorization']) headers['authorization'] = req.headers['authorization'];
    if (req.headers['apikey']) headers['apikey'] = req.headers['apikey'];
    if (req.headers['content-type']) headers['content-type'] = req.headers['content-type'];

    const fetchOptions = {
      method: req.method,
      headers,
    };

    if (!['GET', 'HEAD'].includes(req.method) && req.body) {
      fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);

    // If Supabase sends a 302 redirect to Google OAuth, pass the location header straight to the browser
    if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
      return res.redirect(response.status, response.headers.get('location'));
    }

    const data = await response.arrayBuffer();
    const contentType = response.headers.get('content-type');
    if (contentType) res.setHeader('content-type', contentType);

    res.status(response.status).send(Buffer.from(data));
  } catch (error) {
    res.status(500).json({ error: 'Proxy Request Failed', details: error.message });
  }
}