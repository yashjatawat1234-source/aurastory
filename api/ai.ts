const MAX_PROMPT_CHARS = 14000;

function fail(res: any, status: number, error: string, code?: string) {
  return res.status(status).json({ error, code });
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return fail(res, 405, 'Use POST.');

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return fail(res, 500, 'The AI service is not set up yet (missing server settings).');
  }

  const auth = String(req.headers.authorization || '');
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return fail(res, 401, 'Please sign in to use the AI.', 'auth');

  let body: any = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
  const wantJson = body?.json === true;
  if (!prompt) return fail(res, 400, 'Nothing to send to the AI.');
  if (prompt.length > MAX_PROMPT_CHARS) {
    return fail(res, 400, 'That passage is too long for one request. Try a shorter section.');
  }

  let remaining = 0;
  try {
    const q = await fetch(`${SUPABASE_URL}/rest/v1/rpc/consume_ai_quota`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    });
    if (q.status === 401 || q.status === 403) {
      return fail(res, 401, 'Your sign-in has expired. Please sign in again.', 'auth');
    }
    if (!q.ok) return fail(res, 500, 'Could not check your daily allowance. Please try again.');
    remaining = Number(await q.json());
  } catch {
    return fail(res, 500, 'Could not reach the account service. Please try again.');
  }
  if (remaining < 0) {
    return fail(res, 429, "You've used today's free AI requests. They renew tomorrow.", 'limit');
  }

  const models = [process.env.GEMINI_MODEL || 'gemini-3.8-flash', 'gemini-2.5-flash'];
  const lastError = 'The AI is busy right now. Please try again.';

  for (const model of models) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              maxOutputTokens: 2048,
              ...(wantJson ? { responseMimeType: 'application/json' } : {}),
            },
          }),
        }
      );
      const data: any = await r.json().catch(() => ({}));
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (r.ok && text) return res.status(200).json({ text, remaining });
      console.error('Gemini error', model, r.status, data?.error?.message);
      if (r.status === 400 || r.status === 403) break;
    } catch (err) {
      console.error('Gemini network error', model, err);
    }
  }
  return fail(res, 502, lastError);
}