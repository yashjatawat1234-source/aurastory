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

    // Initialize Gemini API with type casting for Vite
    const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
    const genAI = new GoogleGenerativeAI(apiKey);

    useEffect(() => {
        generateCustomQuestions();
    }, [concept]);

    const generateCustomQuestions = async () => {
        setLoading(true);
        const userPremise = concept || localStorage.getItem('aurastory_concept') || '';

        if (!userPremise.trim()) {
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

    // Prevent form submission & auth modal popup on click
    const fetchNudgeOptions = async (e: React.MouseEvent, qId: string, qContext: string) => {
        e.preventDefault();
        e.stopPropagation();
        setNudgeLoading((prev) => ({ ...prev, [qId]: true }));
        const userPremise = concept || localStorage.getItem('aurastory_concept') || '';

        // Question-specific rich fallback options in case API fails
        const richFallbacks: Record<string, string[]> = {
            protagonist: [
                'Option A: Driven by profound guilt over Julian\'s unresolved disappearance, Maya refuses to leave her post even as the storm destroys the perimeter.',
                'Option B: Maya is secretly hiding her own audio symptoms, fearing that acknowledging the strange frequencies will make her superiors declare her unfit for duty.',
                'Option C: She approaches the anomaly with cold scientific detachment, treating Julian\'s voice purely as an engineered signal manipulation intended to bait her.'
            ],
            obstacle: [
                'Option A: The Hollow\'s magnetic threshold bends ambient audio, causing Maya\'s own voice to echo back to her with minutes of delay in terrifying sub-frequencies.',
                'Option B: A rogue former station director is secretly transmitting fake signal logs to manipulate Maya into breaching the protected forest sanctuary zone.',
                'Option C: The storm cuts all power and landlines simultaneously, forcing Maya to navigate pitch-black, storm-swept mountain terrain using only analogue instruments.'
            ],
            beginning: [
                'Option A: While digitizing a corroded 1984 tape, Maya isolates a subterranean knock sequence that matches her brother\'s personal code, followed by a live shortwave respond.',
                'Option B: An automated emergency broadcast ping wakes Maya at midnight, transmitting a GPS coordinate sequence accompanied by Julian\'s voice reciting her current room number.',
                'Option C: A sudden voltage surge inside the listening post fries the digital loggers, leaving only a single reel-to-reel tape playing a looping transmission of Julian calling her name.'
            ],
            ending: [
                'Option A: Reaching the signal source deep inside The Hollow, Maya discovers an acoustic feedback loop preserved in stone, forcing her to broadcast the truth to save others.',
                'Option B: Maya realizes the voice is a warning from a future timeline, and she must permanently sever the station\'s transmitter, leaving Julian\'s memory in the past.',
                'Option C: In a tense climax inside the storm center, Maya uses her scanner to project a counter-frequency, stabilizing the anomaly and leaving a permanent record of what happened.'
            ]
        };

        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const prompt = `
You are an expert script doctor and narrative strategist for screenplays and audio series.
Story Premise: "${userPremise}"
Target Story Pillar: "${qContext}"

Provide 3 distinct, highly expressive, atmospheric, and grounded story directions (2-3 rich sentences each) that the writer can choose to answer this pillar.
Incorporate specific details, character motivations, and atmospheric hooks matching the premise's genre and tone.

Return ONLY a valid raw JSON array containing 3 string items without markdown wrappers:
["Detailed Option 1 text...", "Detailed Option 2 text...", "Detailed Option 3 text..."]
`;

            const result = await model.generateContent(prompt);
            const rawText = result.response.text().trim();
            const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

            let options: string[] = [];
            try {
                options = JSON.parse(cleanJson);
            } catch (parseErr) {
                options = cleanJson
                    .split('\n')
                    .map((line) => line.replace(/^[-*0-9.]+\s*/, '').replace(/^"|"$/g, '').trim())
                    .filter((line) => line.length > 10)
                    .slice(0, 3);
            }

            if (options.length < 3) {
                options = richFallbacks[qId] || richFallbacks['protagonist'];
            }

            setNudgeOptions((prev) => ({ ...prev, [qId]: options }));
            setActiveNudgeId(qId);
        } catch (error) {
            console.error('Nudge generation error:', error);
            // Serve rich question-specific fallbacks on network or API failure
            setNudgeOptions((prev) => ({
                ...prev,
                [qId]: richFallbacks[qId] || richFallbacks['protagonist']
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
                                    onClick={(e) => fetchNudgeOptions(e, q.id, q.context)}
                                    disabled={nudgeLoading[q.id]}
                                    className="inline-flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 font-medium transition-colors disabled:opacity-50"
                                >
                                    {nudgeLoading[q.id] ? (
                                        <span>Generating direction...</span>
                                    ) : (
                                        <span>✨ Stuck? Get 3 Grounded Options</span>
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