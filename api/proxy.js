export default async function handler(req, res) {
  const { path, ...queryParams } = req.query;
  const pathString = Array.isArray(path) ? path.join('/') : path || '';

  // Construct target Supabase URL
  const queryString = new URLSearchParams(queryParams).toString();
  const targetUrl = `https://yhbhgvrwuhxtebvqxggi.supabase.co/${pathString}${queryString ? `?${queryString}` : ''}`;

  try {
    // Strip host headers to prevent proxy origin mismatches
    const headers = { ...req.headers };
    delete headers.host;
    delete headers['x-forwarded-host'];
    delete headers['x-forwarded-proto'];

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
      redirect: 'manual',
    });

    // Pass through response headers and status code
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    res.status(response.status);

    const data = await response.arrayBuffer();
    res.send(Buffer.from(data));
  } catch (error) {
    res.status(500).json({ error: 'Proxy Request Failed', details: error.message });
  }
}