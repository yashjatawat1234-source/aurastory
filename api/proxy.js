export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, apikey, authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parse body if received as string
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {};
    }
  }

  // 1. Intercept Gemini Co-Writer Tasks
  if (body && body.task && (body.task === 'generate_questions' || body.task === 'generate_nudge')) {
    const { premise, questionContext, task } = body;
    const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key is missing on Vercel environment' });
    }

    let prompt = '';
    if (task === 'generate_questions') {
      prompt = `
You are an expert story consultant and script editor.
Analyze this story premise:
"${premise}"

Generate 4 dynamic, highly specific story discovery questions tailored directly to the unique characters, setting, and stakes in this premise.
Return ONLY raw JSON array format without markdown code block syntax:
[
  {
    "id": "protagonist",
    "label": "1. Protagonist & Internal Flaw",
    "context": "Specific question about the main lead",
    "placeholder": "Idea for their motivation..."
  },
  {
    "id": "obstacle",
    "label": "2. Setting Rules & Central Conflict",
    "context": "Specific question about the world or obstacle",
    "placeholder": "Idea for the main conflict..."
  },
  {
    "id": "beginning",
    "label": "3. The Beginning & Inciting Incident",
    "context": "Specific question about how the mystery kicks off",
    "placeholder": "Idea for the opening spark..."
  },
  {
    "id": "ending",
    "label": "4. Target Resolution & Climax",
    "context": "Specific question about the climax",
    "placeholder": "Idea for the resolution..."
  }
]
`;
    } else {
      prompt = `
You are an expert narrative strategist and creative co-writer for screenplays and fiction.
Story Premise: "${premise}"
Target Question: "${questionContext}"

Provide 3 distinct, deeply evocative, grounded narrative choices (2-3 rich sentences each) for how the writer can answer this question.
Base every option strictly on the unique characters, setting, atmosphere, and conflict in the premise.

Return ONLY a raw JSON array of 3 strings without markdown wrappers:
["Option 1 text...", "Option 2 text...", "Option 3 text..."]
`;
    }

    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      const data = await geminiRes.json();

      if (!geminiRes.ok) {
        return res.status(geminiRes.status).json({ error: data.error?.message || 'Gemini API Error' });
      }

      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

      return res.status(200).json({ result: JSON.parse(cleanJson) });
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Server error processing co-writer request' });
    }
  }

  // 2. Default Fallback
  return res.status(200).json({ status: 'Proxy backend active' });
}