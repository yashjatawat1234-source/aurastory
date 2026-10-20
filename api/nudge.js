export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { premise, questionContext } = req.body || {};
  const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API key is not configured on server' });
  }

  const prompt = `
You are an expert narrative strategist and creative co-writer for screenplays and fiction.
Story Premise: "${premise}"
Target Question: "${questionContext}"

Provide 3 distinct, deeply evocative, grounded narrative choices (2-3 rich sentences each) for how the writer can answer this question.
Base every option strictly on the unique characters, setting, atmosphere, and conflict in the premise.

Return ONLY a raw JSON array of 3 strings without markdown wrappers:
["Option 1 text...", "Option 2 text...", "Option 3 text..."]
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Gemini API Error' });
    }

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

    return res.status(200).json({ options: JSON.parse(cleanJson) });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error generating nudge' });
  }
}