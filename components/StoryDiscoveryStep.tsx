import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

  // Initialize Gemini API
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
  const genAI = new GoogleGenerativeAI(apiKey);

  useEffect(() => {
    generateCustomQuestions();
  }, [concept]);

  const generateCustomQuestions = async () => {
    setLoading(true);
    const userPremise = concept || localStorage.getItem('aurastory_concept') || '';

    if (!userPremise.trim()) {
      // Fallback default questions if no concept exists
      setQuestions([
        {
          id: 'protagonist',
          label: '1. Protagonist & Immediate Goal',
          context: 'Who is your main character and what are they trying to accomplish?',
          placeholder: 'e.g., A night-shift technician trying to locate a missing encryption key...',
        },
        {
          id: 'obstacle',
          label: '2. World Rules & Antagonist',
          context: 'What rules govern this world and who or what stands in their way?',
          placeholder: 'e.g., A strictly monitored urban zone where visual distortion occurs at night...',
        },
        {
          id: 'beginning',
          label: '3. Inciting Incident (The Beginning)',
          context: 'What specific event disrupts their normal routine in Scene 1?',
          placeholder: 'e.g., Finding an unexplained audio recording hidden inside an antique wardrobe...',
        },
        {
          id: 'ending',
          label: '4. Climax & Target Resolution (The Ending)',
          context: 'How do you envision the central confrontation or resolution unfolding?',
          placeholder: 'e.g., A tense face-off in pitch darkness where the protagonist must rely solely on sound...',
        },
      ]);
      setLoading(false);
      return;
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `
You are a story consultant and script development editor.
Analyze the following story premise provided by a writer:
"${userPremise}"

Based ONLY on the genre, tone, and details in this premise, generate 4 dynamic, highly specific discovery questions to help the writer flesh out their story structure.
Return JSON strictly in this array format without markdown code blocks:
[
  {
    "id": "protagonist",
    "label": "1. Protagonist & Internal Flaw",
    "context": "Contextual question about the character based on the premise",
    "placeholder": "Grounded answer idea matching their tone"
  },
  {
    "id": "obstacle",
    "label": "2. Setting Rules & Antagonistic Force",
    "context": "Contextual question about the world or main obstacle",
    "placeholder": "Grounded answer idea matching their tone"
  },
  {
    "id": "beginning",
    "label": "3. The Beginning & Status Quo Break",
    "context": "Contextual question about how the story starts",
    "placeholder": "Grounded answer idea matching their tone"
  },
  {
    "id": "ending",
    "label": "4. The Climax & Resolution (The Ending)",
    "context": "Contextual question about the vision for the climax",
    "placeholder": "Grounded answer idea matching their tone"
  }
]
`;

      const result = await model.generateContent(prompt);
      const textResponse = result.response.text().trim().replace(/```json|```/g, '');
      const parsedQuestions: QuestionItem[] = JSON.parse(textResponse);
      setQuestions(parsedQuestions);
    } catch (err) {
      console.error('Failed to generate custom questions:', err);
      // Fallback questions on API error
      setQuestions([
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
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchNudgeOptions = async (qId: string, qContext: string) => {
    setNudgeLoading((prev) => ({ ...prev, [qId]: true }));
    const userPremise = concept || localStorage.getItem('aurastory_concept') || '';

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `
You are a helpful creative writing co-pilot.
The writer is working on this story premise:
"${userPremise}"

They are currently answering this specific story question:
"${qContext}"

Give 3 distinct, grounded, human-sounding directions/options they could choose from to answer this question. Keep each option concise (1-2 sentences max).
Return strictly a JSON array of 3 string items without markdown brackets:
["Option 1 text", "Option 2 text", "Option 3 text"]
`;

      const result = await model.generateContent(prompt);
      const cleanText = result.response.text().trim().replace(/```json|```/g, '');
      const options: string[] = JSON.parse(cleanText);

      setNudgeOptions((prev) => ({ ...prev, [qId]: options }));
      setActiveNudgeId(qId);
    } catch (error) {
      console.error('Nudge generation error:', error);
    } finally {
      setNudgeLoading((prev) => ({ ...prev, [qId]: false }));
    }
  };

  const handleSelectOption = (qId: string, optionText: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: optionText }));
    setActiveNudgeId(null);
  };

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
            ✨ Analyzing your 500-word premise to build dynamic questions...
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

              {/* Interactive Helper Toolbar */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => fetchNudgeOptions(q.id, q.context)}
                  disabled={nudgeLoading[q.id]}
                  className="inline-flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 font-medium transition-colors disabled:opacity-50"
                >
                  {nudgeLoading[q.id] ? (
                    <span>Generating direction...</span>
                  ) : (
                    <>
                      <span>✨ Stuck? Get 3 Grounded Options</span>
                    </>
                  )}
                </button>
              </div>

              {/* Nudge Options Display */}
              {activeNudgeId === q.id && nudgeOptions[q.id] && (
                <div className="mt-3 bg-slate-950 border border-teal-900/60 rounded-lg p-3 space-y-2 animate-fadeIn">
                  <p className="text-xs font-semibold text-teal-300 mb-1">
                    Select an option or click to edit:
                  </p>
                  {nudgeOptions[q.id].map((option, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectOption(q.id, option)}
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