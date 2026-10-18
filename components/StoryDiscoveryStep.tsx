import React, { useState, useEffect } from 'react';

interface StoryDiscoveryStepProps {
  concept: string;
  onNext: (answers: Record<string, string>) => void;
  onBack: () => void;
}

interface QuestionItem {
  id: string;
  label: string;
  context: string;
  placeholder: string;
}

export const StoryDiscoveryStep: React.FC<StoryDiscoveryStepProps> = ({
  concept,
  onNext,
  onBack,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeNudgeId, setActiveNudgeId] = useState<string | null>(null);
  const [nudgeOptions, setNudgeOptions] = useState<Record<string, string[]>>({});
  const [nudgeLoading, setNudgeLoading] = useState<Record<string, boolean>>({});

  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';

  useEffect(() => {
    generateCustomQuestions();
  }, [concept]);

  // Direct REST API Call Helper to bypass SDK Key Restrictions
  const callGeminiRestApi = async (promptText: string): Promise<string> => {
    if (!apiKey) {
      throw new Error('VITE_GEMINI_API_KEY is missing');
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
        }),
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `API HTTP error ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  };

  const generateCustomQuestions = async () => {
    setLoading(true);
    const userPremise = concept || localStorage.getItem('aurastory_concept') || '';

    if (!userPremise.trim()) {
      setQuestions(getFallbackQuestions());
      setLoading(false);
      return;
    }

    try {
      const prompt = `
You are a story consultant and script editor.
Analyze this story premise:
"${userPremise}"

Generate 4 dynamic, highly specific story discovery questions tailored to this premise.
Return ONLY raw JSON array format without markdown wrappers:
[
  {
    "id": "protagonist",
    "label": "1. Protagonist & Internal Flaw",
    "context": "Question about the character based on the premise",
    "placeholder": "Grounded answer idea..."
  },
  {
    "id": "obstacle",
    "label": "2. Setting Rules & Antagonistic Force",
    "context": "Question about the world or main obstacle",
    "placeholder": "Grounded answer idea..."
  },
  {
    "id": "beginning",
    "label": "3. The Beginning & Status Quo Break",
    "context": "Question about how the story starts",
    "placeholder": "Grounded answer idea..."
  },
  {
    "id": "ending",
    "label": "4. The Climax & Resolution (The Ending)",
    "context": "Question about the vision for the climax",
    "placeholder": "Grounded answer idea..."
  }
]
`;

      const rawResponse = await callGeminiRestApi(prompt);
      const cleanJson = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsedQuestions: QuestionItem[] = JSON.parse(cleanJson);
      setQuestions(parsedQuestions);
    } catch (err) {
      console.error('Failed to generate dynamic questions via REST:', err);
      setQuestions(getFallbackQuestions());
    } finally {
      setLoading(false);
    }
  };

  const fetchNudgeOptions = async (e: React.MouseEvent, qId: string, qContext: string) => {
    e.preventDefault();
    e.stopPropagation();
    setNudgeLoading((prev) => ({ ...prev, [qId]: true }));

    const userPremise = concept || localStorage.getItem('aurastory_concept') || '';

    try {
      const prompt = `
You are a creative co-writer and narrative strategist for screenplays and audio series.
Story Premise: "${userPremise}"
Target Story Question: "${qContext}"

Give 3 distinct, deeply evocative, grounded narrative choices (2-3 sentences each) for how the writer can answer this question.
Incorporate specific details, character motivations, and atmospheric hooks from this premise.

Return ONLY a raw JSON array of 3 strings:
["Option 1 text...", "Option 2 text...", "Option 3 text..."]
`;

      const rawResponse = await callGeminiRestApi(prompt);
      const cleanJson = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
      const options: string[] = JSON.parse(cleanJson);

      if (Array.isArray(options) && options.length > 0) {
        setNudgeOptions((prev) => ({ ...prev, [qId]: options }));
        setActiveNudgeId(qId);
      } else {
        throw new Error('Invalid JSON array received');
      }
    } catch (error) {
      console.error('Co-writer REST error:', error);

      // Context-aware fallback using active premise lead
      const activeName = userPremise.trim().split(/\s+/)[0] || 'The protagonist';
      setNudgeOptions((prev) => ({
        ...prev,
        [qId]: [
          `Option A: Driven by deep personal stakes, ${activeName} pursues the anomaly into restricted spaces despite immediate warnings.`,
          `Option B: ${activeName} conceals critical evidence from nearby authorities to investigate the repeating signal alone.`,
          `Option C: Using improvised tools, ${activeName} attempts to stabilize the frequency before the time limit expires.`
        ],
      }));
      setActiveNudgeId(qId);
    } finally {
      setNudgeLoading((prev) => ({ ...prev, [qId]: false }));
    }
  };

  const handleSelectOption = (e: React.MouseEvent, qId: string, optionText: string) => {
    e.preventDefault();
    e.stopPropagation();
    setAnswers((prev) => ({ ...prev, [qId]: optionText }));
    setActiveNudgeId(null);
  };

  const getFallbackQuestions = (): QuestionItem[] => [
    {
      id: 'protagonist',
      label: '1. Protagonist & Immediate Goal',
      context: 'In your story premise, who is the main lead and what personal obstacle limits them?',
      placeholder: 'Describe your protagonist...',
    },
    {
      id: 'obstacle',
      label: '2. Setting & Central Conflict',
      context: 'What strict rule or opposing force creates resistance in this world?',
      placeholder: 'Describe the primary conflict...',
    },
    {
      id: 'beginning',
      label: '3. Inciting Incident (The Beginning)',
      context: 'What moment breaks their routine and kicks off the narrative?',
      placeholder: 'Describe the opening spark...',
    },
    {
      id: 'ending',
      label: '4. Target Resolution (The Ending)',
      context: 'What impact or decision marks the conclusion of this arc?',
      placeholder: 'Describe your target climax...',
    },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-3 py-1 rounded-full">
          Step 2 of 3 • Story Discovery
        </span>
        <h2 className="text-3xl font-extrabold text-white">Flesh Out Your World</h2>
        <p className="text-slate-400 text-sm max-w-lg mx-auto">
          These questions are built directly from your premise. Answer in your own words—or click{' '}
          <span className="text-teal-300 font-medium">"Get AI Nudge"</span> if you need grounded options.
        </p>
      </div>

      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 space-y-6 animate-pulse">
          <div className="h-4 bg-slate-800 rounded w-1/3"></div>
          <div className="h-10 bg-slate-950/80 rounded-lg"></div>
          <div className="h-4 bg-slate-800 rounded w-1/2"></div>
          <div className="h-10 bg-slate-950/80 rounded-lg"></div>
          <p className="text-center text-xs text-teal-400 font-medium">
            ✨ Analyzing your premise to build dynamic co-writer questions...
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-6">
          {questions.map((q) => (
            <div key={q.id} className="space-y-2 pb-4 border-b border-slate-800/80 last:border-none">
              <label className="block text-sm font-semibold text-slate-200">{q.label}</label>
              <p className="text-xs text-slate-400 leading-relaxed">{q.context}</p>

              <textarea
                rows={2}
                value={answers[q.id] || ''}
                onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                placeholder={q.placeholder}
                className="w-full bg-slate-950/70 border border-slate-800 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors resize-none"
              />

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={(e) => fetchNudgeOptions(e, q.id, q.context)}
                  disabled={nudgeLoading[q.id]}
                  className="inline-flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 font-medium transition-colors disabled:opacity-50"
                >
                  {nudgeLoading[q.id] ? (
                    <span>Generating co-writer direction...</span>
                  ) : (
                    <span>✨ Stuck? Get 3 Grounded Options</span>
                  )}
                </button>
              </div>

              {activeNudgeId === q.id && nudgeOptions[q.id] && (
                <div className="mt-3 bg-slate-950 border border-teal-900/60 rounded-lg p-3 space-y-2 animate-fadeIn">
                  <p className="text-xs font-semibold text-teal-300 mb-1">
                    Select an option or click to apply:
                  </p>
                  {nudgeOptions[q.id].map((option, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={(e) => handleSelectOption(e, q.id, option)}
                      className="w-full text-left text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white p-2.5 rounded border border-slate-800/80 transition-colors"
                    >
                      💡 {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={onBack}
              className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
            >
              ← Back to Premise
            </button>

            <button
              type="button"
              onClick={() => onNext(answers)}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-2.5 rounded-lg transition-colors shadow-lg"
            >
              Choose Workspace Format →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};