import React, { useState, useEffect } from 'react'
// @ts-ignore
import './styles.css'
import { PremiseInput } from './PremiseInput';
import { ScreenplayEditor, ScriptBlock } from './ScreenplayEditor';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SceneVisualizer } from './SceneVisualizer';
import { supabase } from './src/lib/supabase';

interface Scene {
  id: string;
  title: string;
  blocks?: ScriptBlock[];
  content?: string;
}

export interface Chapter {
  id: string
  title: string
  scenes: Scene[]
}

interface BibleEntry {
  name: string
  category: string
  current_state: string
  secrets_and_history: string
}

function AuthModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [authStep, setAuthStep] = useState<'CHOICE' | 'EMAIL'>('CHOICE');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  const handleGoogleSignIn = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    setErrorMsg('');

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    setErrorMsg('');

    // Attempt to register a new account
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      // If user is already registered, perform sign-in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setErrorMsg(signInError.message);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    onSuccess();
  };

  return (
    <div
      className="w-full max-w-md relative bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl z-[100000]"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={handleClose}
        className="absolute top-4 right-4 text-slate-400 hover:text-white text-sm p-2 rounded-lg transition-colors cursor-pointer z-20"
      >
        ✕
      </button>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">
          {errorMsg}
        </div>
      )}

      {authStep === 'CHOICE' ? (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white mb-1">Save Your Work</h2>
          <p className="text-slate-400 text-sm mb-6">
            Choose how you'd like to sign in to save your progress and continue.
          </p>

          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 font-semibold py-2.5 rounded-lg text-sm hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            {loading ? 'Connecting...' : 'Sign in with Google'}
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900 px-2 text-slate-500">Or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setErrorMsg('');
              setAuthStep('EMAIL');
            }}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors cursor-pointer border border-slate-700"
          >
            Sign in with Email
          </button>
        </div>
      ) : (
        <div>
          <button
            type="button"
            onClick={() => {
              setErrorMsg('');
              setAuthStep('CHOICE');
            }}
            className="text-xs text-teal-400 hover:underline mb-3 block"
          >
            ← Back to sign in options
          </button>

          <h2 className="text-xl font-bold mb-1 text-white">Save Your Work</h2>
          <p className="text-slate-400 text-sm mb-6">
            Enter your credentials to save your project concept and continue shaping your story.
          </p>

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold py-2 rounded-lg text-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Continue to Step 2 →'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
export default function App() {
  const [isWorkspaceActive, setIsWorkspaceActive] = useState<boolean>(false)
  const [onboardingConcept, setOnboardingConcept] = useState<string>('')
  // Onboarding Discovery State
  const [onboardingStage, setOnboardingStage] = useState<'PREMISE' | 'PITCH' | 'QUESTIONS' | 'FORMAT_SELECT'>('PREMISE');
  const [projectFormat, setProjectFormat] = useState<'screenplay' | 'audio_drama' | 'novel'>('screenplay')
  const [showAuthModal, setShowAuthModal] = useState(false);
  console.log("CURRENT STATE:", { onboardingStage, showAuthModal });
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Checks if the clicked element or any parent container is a button
      const button = target.closest('button');
      if (button) {
        console.log('BUTTON CLICKED GLOBALLY:', button);
        setShowAuthModal(true);
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);
  // Script blocks state with automatic localStorage persistence
  const [scriptBlocks, setScriptBlocks] = useState<ScriptBlock[]>(() => {
    const saved = localStorage.getItem('aurastory_active_script');
    return saved ? JSON.parse(saved) : [
      { id: '1', type: 'SCENE_HEADING', text: 'INT. POLICE STATION - NIGHT' },
      { id: '2', type: 'ACTION', text: 'Rain lashes against the grime-streaked window.' },
    ];
  });

  // Auto-save whenever script blocks change
  useEffect(() => {
    localStorage.setItem('aurastory_active_script', JSON.stringify(scriptBlocks));
  }, [scriptBlocks]);

  // Discovery Answers State
  const [discoveryAnswers, setDiscoveryAnswers] = useState({
    protagonist: '',
    conflict: '',
    worldTone: '',
    keyTwist: ''
  })
  // 1. Chapters & Scenes State
  const [chapters, setChapters] = useState<Chapter[]>(() => {
    const saved = localStorage.getItem('aurastory_chapters');
    return saved
      ? JSON.parse(saved)
      : [
        {
          id: 'ch-1',
          title: 'Chapter 1: The Signal Drops',
          scenes: [
            {
              id: 'sc-1',
              title: 'Scene 1: Rooftop Chase',
              blocks: [
                { id: '1', type: 'SCENE_HEADING', text: 'EXT. ROOFTOP - NIGHT' },
                { id: '2', type: 'ACTION', text: 'The neon lights flickered across the wet pavement as the signal dropped.' },
              ],
            },
            {
              id: 'sc-2',
              title: 'Scene 2: Encrypted Alleyway',
              blocks: [
                { id: '1', type: 'SCENE_HEADING', text: 'EXT. ALLEYWAY - NIGHT' },
                { id: '2', type: 'ACTION', text: 'Rain heavy-poured into the alleyway. Jack stepped out from the shadows.' },
              ],
            },
          ],
        },
      ];
  });
  // Active Scene ID state
  const [activeSceneId, setActiveSceneId] = useState<string>('sc-1');

  // Automatically save chapters whenever edited
  useEffect(() => {
    localStorage.setItem('aurastory_chapters', JSON.stringify(chapters));
  }, [chapters]);

  // Get the active scene object
  const activeScene =
    chapters.flatMap((ch) => ch.scenes).find((sc) => sc.id === activeSceneId) ||
    chapters[0]?.scenes[0];

  // Safely retrieves blocks for the active scene, with fallbacks for legacy/empty scenes
  const getActiveBlocks = (): ScriptBlock[] => {
    if (activeScene?.blocks && activeScene.blocks.length > 0) {
      return activeScene.blocks;
    }
    if (activeScene?.content) {
      return [
        { id: '1', type: 'SCENE_HEADING', text: activeScene.title.toUpperCase() },
        { id: '2', type: 'ACTION', text: activeScene.content },
      ];
    }
    return [{ id: '1', type: 'SCENE_HEADING', text: 'INT. NEW SCENE - DAY' }];
  };

  // Handler to update blocks for the selected scene
  const handleUpdateActiveBlocks = (updatedBlocks: ScriptBlock[]) => {
    setChapters((prevChapters) =>
      prevChapters.map((chapter) => ({
        ...chapter,
        scenes: chapter.scenes.map((scene) =>
          scene.id === activeSceneId ? { ...scene, blocks: updatedBlocks } : scene
        ),
      }))
    );
  };

  // Append a new block directly to the active scene
  const addBlockToActiveScene = (type: any, defaultText: string = '') => {
    const currentBlocks = getActiveBlocks();
    const newBlock: ScriptBlock = {
      id: Date.now().toString(),
      type,
      text: defaultText,
    };
    handleUpdateActiveBlocks([...currentBlocks, newBlock]);
  };
  // Handler to auto-continue scene: Live proxy AI with local dynamic fallback
  const handleAutoContinueScene = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    const currentBlocks = getActiveBlocks();
    let newBlocks: ScriptBlock[] = [];

    try {
      const recentContext = currentBlocks
        .slice(-8)
        .map((b) => `${b.type}: ${b.text}`)
        .join('\n');

      const prompt = `You are an expert screenplay writer co-authoring a scene.
Continue the scene naturally by generating 3 to 4 logical, engaging screenplay blocks based on recent context.

Scene Title: ${activeScene?.title || 'Current Scene'}
Recent Context:
${recentContext}

OUTPUT INSTRUCTIONS:
Return ONLY a valid JSON array of objects without markdown formatting or backticks.
JSON Schema:
[
  { "type": "ACTION" | "CHARACTER" | "DIALOGUE" | "PARENTHETICAL", "text": "string" }
]`;

      // 1. Call Vite backend proxy endpoint
      const response = await fetch('/api/continue-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (response.ok) {
        const data = await response.json();
        const rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (rawJsonText) {
          const parsedBlocks = JSON.parse(rawJsonText);
          newBlocks = parsedBlocks.map((item: any, idx: number) => ({
            id: `${Date.now()}_${idx}`,
            type: item.type || 'ACTION',
            text: item.text || '',
          }));
        }
      }
    } catch (error) {
      console.warn('Proxy AI call offline/failed. Falling back to local engine.', error);
    }

    // 2. Fallback: Generate dynamic local beats if proxy didn't return blocks
    if (!newBlocks || newBlocks.length === 0) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const beatVariations = [
        [
          { type: 'ACTION', text: 'A heavy steel door rattles against its hinges down the corridor.' },
          { type: 'CHARACTER', text: 'ARIAN' },
          { type: 'PARENTHETICAL', text: '(whispering)' },
          { type: 'DIALOGUE', text: 'They know we entered the mainframe.' },
        ],
        [
          { type: 'ACTION', text: 'Emergency lights flicker across the ceiling, casting long amber shadows.' },
          { type: 'CHARACTER', text: 'MAYA' },
          { type: 'DIALOGUE', text: 'Keep moving. We have less than two minutes before lockup.' },
          { type: 'ACTION', text: 'She pulls a terminal drive from her jacket and connects it to the wall junction.' },
        ],
        [
          { type: 'ACTION', text: 'The security console chirps as decrypted data streams across the monitor.' },
          { type: 'CHARACTER', text: 'ARIAN' },
          { type: 'DIALOGUE', text: 'Did you trace the signal origin?' },
          { type: 'CHARACTER', text: 'MAYA' },
          { type: 'DIALOGUE', text: 'It is coming from inside the building.' },
        ],
      ];

      const beatIndex = currentBlocks.length % beatVariations.length;
      const selectedBeat = beatVariations[beatIndex];

      newBlocks = selectedBeat.map((item, idx) => ({
        id: `${Date.now()}_${idx}`,
        type: item.type as any,
        text: item.text,
      }));
    }

    handleUpdateActiveBlocks([...currentBlocks, ...newBlocks]);
    setIsGenerating(false);
  };
  const [isScratchpadOpen, setIsScratchpadOpen] = useState<boolean>(false)
  const [isBibleOpen, setIsBibleOpen] = useState<boolean>(false)
  const [isWhatIfOpen, setIsWhatIfOpen] = useState<boolean>(false)
  const [whatIfPrompt, setWhatIfPrompt] = useState<string>('')
  const [whatIfOutput, setWhatIfOutput] = useState<string>('')
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true)
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false)
  const [newEntryName, setNewEntryName] = useState<string>('')
  const [newEntryState, setNewEntryState] = useState<string>('')
  const [storyCanvas, setStoryCanvas] = useState<string>(() => {
    return localStorage.getItem('aurastory_canvas') || ''
  })

  useEffect(() => {
    localStorage.setItem('aurastory_canvas', storyCanvas)
  }, [storyCanvas])
  const handleExport = () => {
    const blob = new Blob([storyCanvas], { type: 'text/markdown;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'scene-draft.md')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  const callGeminiAPI = async (promptText: string, cleanKey: string): Promise<string> => {
    // Current active Gemini endpoints
    const candidateModels = [
      'gemini-3.8-flash',
      'gemini-2.5-flash',
      'gemini-2.5-pro'
    ]

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
    let lastErrorMessage = ''

    for (const model of candidateModels) {
      try {
        let response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: promptText }] }],
            }),
          }
        )

        const data = await response.json()

        if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          return data.candidates[0].content.parts[0].text
        }

        const errorMsg = data.error?.message || `Status ${response.status}`

        // Stop immediately ONLY if the issue is API key validity or quota limits
        if (
          response.status === 401 ||
          response.status === 403 ||
          errorMsg.toLowerCase().includes('key') ||
          errorMsg.toLowerCase().includes('quota')
        ) {
          throw new Error(`[${model}] ${errorMsg}`)
        }

        // Pause and retry once if Google returns high demand (503 or 429)
        if (response.status === 503 || response.status === 429) {
          await delay(1200)
          let retryRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }],
              }),
            }
          )
          let retryData = await retryRes.json()
          if (retryRes.ok && retryData.candidates?.[0]?.content?.parts?.[0]?.text) {
            return retryData.candidates[0].content.parts[0].text
          }
        }

        lastErrorMessage = `[${model}] ${errorMsg}`
      } catch (err: any) {
        if (err.message?.startsWith('[')) throw err
        lastErrorMessage = err.message || 'Network error.'
      }
    }

    throw new Error(lastErrorMessage || 'All Gemini model endpoints failed.')
  }
  const handleWhatIf = async () => {
    if (!whatIfPrompt || !whatIfPrompt.trim()) return

    const cleanKey = (
      apiKey ||
      (import.meta as any).env?.VITE_GEMINI_API_KEY ||
      localStorage.getItem('aurastory_gemini_key') ||
      ''
    ).trim()

    if (!cleanKey) {
      alert('Please enter your Gemini API Key in the top header field.')
      return
    }

    setIsGenerating(true)

    const bibleContext = storyBible.length > 0
      ? storyBible.map((entry: any) => `- ${entry.name}: ${entry.content || entry.description || entry.text || ''}`).join('\n')
      : 'No active Story Bible rules defined.'

    const promptText = `You are an elite creative writing mentor and master narrative strategist.

STORY BIBLE & CHARACTER RULES:
${bibleContext}

WRITER'S SAMPLE CANVAS:
"""
${storyCanvas || 'No active scene context provided.'}
"""

WRITER'S "WHAT IF?" EXPLORATION:
"${whatIfPrompt}"

TASK:
1. Detect exact language and script (Hindi/Devanagari, Hinglish, English) and respond in that same language.
2. Respect Story Bible consistency.
3. Provide exactly 3 numbered alternate plot options (1., 2., 3.), each a detailed 3-5 sentence paragraph.`

    try {
      const generatedText = await callGeminiAPI(promptText, cleanKey)
      const branches = generatedText
        .split(/\n(?=[1-3]\.\s*)/)
        .map((branch: string) => branch.replace(/^[1-3]\.\s*/, '').trim())
        .filter((branch: string) => branch.length > 0)
        .slice(0, 3)

      setWhatIfBranches(branches)
    } catch (err: any) {
      alert(`What If Error: ${err.message}`)
    } finally {
      setIsGenerating(false)
    }
  }
  const handleAutoContinue = async () => {
    if (!storyCanvas || !storyCanvas.trim()) {
      alert('Please write or paste some text on the canvas first!')
      return
    }

    const cleanKey = (
      apiKey ||
      (import.meta as any).env?.VITE_GEMINI_API_KEY ||
      localStorage.getItem('aurastory_gemini_key') ||
      ''
    ).trim()

    if (!cleanKey) {
      alert('Please enter your Gemini API Key in the top header field.')
      return
    }

    setIsGenerating(true)

    const contextSnippet = storyCanvas.slice(-3000)
    const bibleContext = storyBible.length > 0
      ? storyBible.map((entry: any) => `- ${entry.name}: ${entry.content || entry.description || entry.text || ''}`).join('\n')
      : 'No active Story Bible rules defined.'

    const promptText = `You are an elite creative writing partner and narrative strategist.

STORY BIBLE & CHARACTER RULES:
${bibleContext}

CURRENT SCENE CONTEXT:
"""
${contextSnippet}
"""

DIRECTIVE:
1. Continue narrative smoothly from the exact ending word of the context.
2. Match the exact language, script, tone, and prose style.
3. Write 1 to 2 narrative paragraphs (3–6 sentences total). Return ONLY prose.`

    try {
      const generatedText = await callGeminiAPI(promptText, cleanKey)
      setStoryCanvas((prev) => `${prev.trimEnd()}\n\n${generatedText.trim()}`)
    } catch (err: any) {
      alert(`Auto-Continue Error: ${err.message}`)
    } finally {
      setIsGenerating(false)
    }
  }
  const handleGenerateAIContinuation = async () => {
    if (!apiKey || !apiKey.trim()) {
      alert('Please enter your Gemini API Key in the header field.')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey.trim()}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Continue the following story scene naturally with 2-3 atmospheric paragraphs:\n\n${storyCanvas}`,
                  },
                ],
              },
            ],
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP ${response.status} Error`)
      }

      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (generatedText) {
        setStoryCanvas((prev) => `${prev}\n\n${generatedText.trim()}`)
      } else {
        alert('Gemini returned an empty response. Try clicking again.')
      }
    } catch (err: any) {
      console.error('Gemini API Error:', err)
      alert(`Generation Error: ${err.message || 'Failed to reach Gemini API'}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const [scratchpadText, setScratchpadText] = useState<string>(() => {
    return (
      localStorage.getItem('aurastory_scratchpad') ||
      '• Future Chapter Idea: Jack reveals a hidden cipher inside his medallion.'
    )
  })
  useEffect(() => {
    localStorage.setItem('aurastory_scratchpad', scratchpadText)
  }, [scratchpadText])
  const [storyBible, setStoryBible] = useState<BibleEntry[]>(() => {
    const saved = localStorage.getItem('aurastory_bible')
    return saved
      ? JSON.parse(saved)
      : [
        {
          name: 'Elena Vance',
          category: 'Character',
          current_state: 'Hiding a classified transmission code.',
          secrets_and_history: 'Former lead cryptographer for the Syndicate.',
        },
        {
          name: 'The Neon Protocol',
          category: 'World Lore',
          current_state: 'Active across all sector nodes.',
          secrets_and_history: 'Can be overridden only by a bloodline biometric key.',
        },
      ]
  })
  useEffect(() => {
    localStorage.setItem('aurastory_bible', JSON.stringify(storyBible))
  }, [storyBible])
  const handleAddBibleEntry = () => {
    if (!newEntryName.trim()) return
    const newEntry = {
      name: newEntryName,
      category: 'General',
      current_state: newEntryState || 'Active',
      secrets_and_history: ''
    }
    setStoryBible((prev) => {
      // Automatically remove sample placeholder entries
      const customEntries = prev.filter(
        (entry) => entry.name !== 'Elena Vance' && entry.name !== 'The Neon Protocol'
      )
      return [...customEntries, newEntry]
    })
    setNewEntryName('')
    setNewEntryState('')
  }
  const handleDeleteBibleEntry = (indexToDelete: number) => {
    setStoryBible((prev) => prev.filter((_, index) => index !== indexToDelete))
  }
  // Gemini State
  const [apiKey, setApiKey] = useState<string>(
    (import.meta as any).env?.VITE_GEMINI_API_KEY || localStorage.getItem('aurastory_gemini_key') || ''
  )
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [whatIfInput, setWhatIfInput] = useState<string>('')
  const [whatIfBranches, setWhatIfBranches] = useState<string[]>([])
  const [newChapterTitle, setNewChapterTitle] = useState<string>('')
  // Switch Active Scene (Loads that scene's content onto the canvas)
  const handleSelectScene = (sceneId: string) => {
    for (const ch of chapters) {
      const found = ch.scenes.find((sc) => sc.id === sceneId)
      if (found) {
        setActiveSceneId(sceneId)
        setStoryCanvas(found.content || '')
        break
      }
    }
  }

  // Create New Chapter
  const handleAddChapter = () => {
    const title = newChapterTitle.trim() || `Chapter ${chapters.length + 1}`;
    const newChapterId = `ch-${Date.now()}`;
    const newSceneId = `sc-${Date.now()}`;

    const newChapter: Chapter = {
      id: newChapterId,
      title: title,
      scenes: [
        {
          id: newSceneId,
          title: 'Scene 1: Introduction',
          blocks: [
            { id: '1', type: 'SCENE_HEADING', text: 'INT. NEW LOCATION - DAY' }
          ]
        }
      ]
    };

    setChapters((prev) => [...prev, newChapter]);
    setActiveSceneId(newSceneId);
    setNewChapterTitle('');
  };

  // Create New Scene inside a Chapter
  const handleAddScene = (chapterId: string) => {
    const newScId = `sc-${Date.now()}`;

    setChapters((prev) =>
      prev.map((ch) => {
        if (ch.id === chapterId) {
          const sceneNum = ch.scenes.length + 1;
          const newScene: Scene = {
            id: newScId,
            title: `Scene ${sceneNum}: New Scene`,
            blocks: [
              { id: '1', type: 'SCENE_HEADING', text: 'INT. NEW LOCATION - DAY' }
            ]
          };
          return { ...ch, scenes: [...ch.scenes, newScene] };
        }
        return ch;
      })
    );

    setActiveSceneId(newScId);
  };

  // Delete Scene
  const handleDeleteScene = (chapterId: string, sceneId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setChapters((prev) =>
      prev.map((ch) => {
        if (ch.id === chapterId) {
          return { ...ch, scenes: ch.scenes.filter((sc) => sc.id !== sceneId) }
        }
        return ch
      })
    )
  }

  // Sync active canvas changes back to the active scene object
  useEffect(() => {
    setChapters((prev: Chapter[]) =>
      prev.map((ch: Chapter) => ({
        ...ch,
        scenes: ch.scenes.map((sc: Scene) =>
          sc.id === activeSceneId ? { ...sc, content: storyCanvas } : sc
        ),
      }))
    )
  }, [storyCanvas, activeSceneId])

  // Local Storage Syncs
  useEffect(() => {
    localStorage.setItem('aurastory_chapters', JSON.stringify(chapters))
  }, [chapters])

  useEffect(() => {
    localStorage.setItem('aurastory_scratchpad', scratchpadText)
  }, [scratchpadText])

  useEffect(() => {
    localStorage.setItem('aurastory_bible', JSON.stringify(storyBible))
  }, [storyBible])

  useEffect(() => {
    localStorage.setItem('aurastory_gemini_key', apiKey)
  }, [apiKey])

  const handleExportManuscript = () => {
    let fullText = `# AuraStory Compiled Manuscript\n\n`
    chapters.forEach((ch: Chapter) => {
      fullText += `========================================\n`
      fullText += `${ch.title.toUpperCase()}\n`
      fullText += `========================================\n\n`
      ch.scenes.forEach((sc: Scene) => {
        fullText += `--- ${sc.title} ---\n`
        fullText += `${sc.content}\n\n`
      })
      fullText += `\n`
    })

    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `AuraStory_Manuscript_${new Date().toISOString().slice(0, 10)}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleExportLoreJSON = () => {
    const jsonString = JSON.stringify(
      {
        project: 'AuraStory Workspace',
        exportedAt: new Date().toISOString(),
        bible: storyBible,
        scratchpad: scratchpadText,
      },
      null,
      2
    )

    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `AuraStory_Lore_Bible_${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleGenerateWhatIf = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!whatIfInput.trim()) return

    if (!apiKey || !apiKey.trim()) {
      alert('Please enter your Gemini API Key in the top header field.')
      return
    }

    setIsGenerating(true)
    try {
      const cleanKey = apiKey.trim()
      const promptText = `You are an elite creative writing mentor and master narrative strategist.

WRITER'S SAMPLE CANVAS (ANALYZE THIS FOR STYLE, VOICE, VOCABULARY & RHYTHM):
"""
${storyCanvas || 'No active scene context provided.'}
"""

WRITER'S "WHAT IF?" EXPLORATION:
"${whatIfInput}"

TASK & STYLE-CLONING DIRECTIVE:
1. VOICE & STYLE ANALYSIS: Analyze the sample canvas above for its exact prose style, sentence length, atmospheric mood, vocabulary level, and sensory detail.
2. LANGUAGE & SCRIPT CLONING: Detect the exact language and script used (e.g., Hindi in Devanagari, Hinglish, or English). You MUST generate all responses in that EXACT SAME language and script. If the canvas/question is in Hindi, respond strictly in rich, authentic Hindi.
3. NARRATIVE GENERATION: Develop 3 compelling, dramatic, and immersive plot directions based on the writer's "What If?" question. Each option must match the writer's voice so naturally that it feels like their own internal creative instinct speaking.

FORMATTING RULE:
Provide exactly 3 distinct numbered options (1., 2., 3.). Each option must be a detailed, atmospheric paragraph (3 to 5 sentences long) full of narrative tension, character emotion, and vivid storytelling possibilities. Avoid generic or superficial summaries.

1. [Style-Matched Detailed Plot Branch 1]
2. [Style-Matched Detailed Plot Branch 2]
3. [Style-Matched Detailed Plot Branch 3]`

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${cleanKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
          }),
        }
      )

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to generate style-matched plot branches.')
      }

      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (generatedText) {
        const branches = generatedText
          .split(/\n(?=[1-3]\.\s*)/)
          .map((branch: string) => branch.replace(/^[1-3]\.\s*/, '').trim())
          .filter((branch: string) => branch.length > 0)
          .slice(0, 3)

        setWhatIfBranches(branches)
      }
    } catch (err: any) {
      console.error('What If Generation Error:', err)
      alert(`What If Error: ${err.message || 'Failed to generate plot branches.'}`)
    } finally {
      setIsGenerating(false)
    }
  }
  const handleLaunchWorkspace = () => {
    // 1. Build structured Scratchpad summary
    const summaryHeader = `=== PROJECT SUMMARY (${projectFormat.toUpperCase().replace('_', ' ')}) ===\n`
    const premiseBlock = `\n--- Initial Premise ---\n${onboardingConcept.trim()}\n`

    const answersBlock = `\n--- Narrative Foundations ---\n` +
      `• Protagonist & Goal: ${discoveryAnswers.protagonist || 'N/A'}\n` +
      `• Core Conflict: ${discoveryAnswers.conflict || 'N/A'}\n` +
      `• World & Tone: ${discoveryAnswers.worldTone || 'N/A'}\n` +
      `• Key Twist / Pivot: ${discoveryAnswers.keyTwist || 'N/A'}\n`

    const formattedNotes = `${summaryHeader}${premiseBlock}${answersBlock}`

    setScratchpadText((prev) => prev ? `${prev}\n\n${formattedNotes}` : formattedNotes)

    // 2. Pre-fill initial Canvas hook according to selected format
    let initialCanvasText = ''
    if (projectFormat === 'screenplay') {
      initialCanvasText = `EXT. CITY STREET - NIGHT\n\nRain glimmers under neon signs. A shadowy figure moves swiftly along the alleyway.\n\nPROTAGONIST\n(whispering)\nWe don't have much time.`
    } else if (projectFormat === 'audio_drama') {
      initialCanvasText = `[SFX: Heavy footsteps echoing on wet pavement]\n[SFX: Distant siren wailing]\n\nNARRATOR (V.O.)\nThe transmission dropped at midnight.\n\n[MUSIC: Low ambient synthesizer swell builds]`
    } else {
      initialCanvasText = `The city was unusually quiet for a Friday night, the kind of stillness that always preceded trouble. Rain streaked across the glass in jagged lines...`
    }

    // Update active scene canvas
    if (chapters.length > 0 && chapters[0].scenes.length > 0) {
      const updatedChapters = [...chapters]
      updatedChapters[0].scenes[0].content = initialCanvasText
      setChapters(updatedChapters)
    }

    setIsWorkspaceActive(true)
  }
  if (!isWorkspaceActive) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="max-w-2xl w-full text-center space-y-6">

          {/* STAGE 1: INITIAL PITCH & PREMISE */}
          {(onboardingStage === 'PREMISE' || onboardingStage === 'PITCH') && (
            <div className="relative z-50 w-full max-w-2xl mx-auto text-center space-y-6 pointer-events-auto">
              <h1 className="text-4xl font-extrabold text-teal-400">AuraStory Studio</h1>
              <p className="text-slate-400 text-sm">Step 1 of 3: Core Story Premise</p>
              <p className="text-slate-300 italic text-sm max-w-xl mx-auto">
                "Choose from our supported writing formats to customize your workspace rules and AI features. AuraStory seamlessly adapts its layout whether you're crafting film, audio, short, or ads."
              </p>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl text-center relative z-50 pointer-events-auto">
                <label className="block text-sm font-medium text-slate-300 mb-2 text-center">
                  What story are we bringing to life today?
                </label>
                <PremiseInput
                  onLoginSuccess={(savedPrompt: string) => {
                    setOnboardingConcept(savedPrompt);
                    setShowAuthModal(true);
                  }}
                  onSubmit={() => {
                    setShowAuthModal(true);
                  }}
                />
              </div>
            </div>
          )}
          {showAuthModal && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/70 backdrop-blur-md pointer-events-auto">
              <AuthModal
                onClose={() => setShowAuthModal(false)}
                onSuccess={() => {
                  setShowAuthModal(false);
                  setOnboardingStage('QUESTIONS');
                }}
              />
            </div>
          )}
          {/* STAGE 2: DEEP QUESTIONS */}
          {onboardingStage === 'QUESTIONS' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl text-left space-y-4">
              <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Story Discovery</p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">1. Who is the main protagonist and what is their immediate goal?</label>
                  <input
                    type="text"
                    value={discoveryAnswers.protagonist}
                    onChange={(e) => setDiscoveryAnswers({ ...discoveryAnswers, protagonist: e.target.value })}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                    placeholder="e.g., Detective Miles searching for a missing transmission key"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">2. What major obstacle or antagonist stands in their way?</label>
                  <input
                    type="text"
                    value={discoveryAnswers.conflict}
                    onChange={(e) => setDiscoveryAnswers({ ...discoveryAnswers, conflict: e.target.value })}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                    placeholder="e.g., A corrupt syndicate enforcing a city-wide blackout"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">3. Describe the atmosphere or core setting of the story:</label>
                  <input
                    type="text"
                    value={discoveryAnswers.worldTone}
                    onChange={(e) => setDiscoveryAnswers({ ...discoveryAnswers, worldTone: e.target.value })}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                    placeholder="e.g., Rain-slicked dystopian cyberpunk city, dark and suspenseful"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">4. Is there a secret or twist driving early chapters?</label>
                  <input
                    type="text"
                    value={discoveryAnswers.keyTwist}
                    onChange={(e) => setDiscoveryAnswers({ ...discoveryAnswers, keyTwist: e.target.value })}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                    placeholder="e.g., The missing cipher is hidden inside the protagonist's medallion"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                <button
                  onClick={() => setOnboardingStage('PITCH')}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setOnboardingStage('FORMAT_SELECT')}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors text-sm shadow-lg shadow-emerald-900/30"
                >
                  Choose Format →
                </button>
              </div>
            </div>
          )}

          {/* STAGE 3: FORMAT SELECTION */}
          {onboardingStage === 'FORMAT_SELECT' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl text-left space-y-5">
              <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Choose Workspace Layout</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setProjectFormat('screenplay')}
                  className={`p-4 rounded-xl border text-left transition-all ${projectFormat === 'screenplay'
                    ? 'border-emerald-500 bg-emerald-950/20 shadow-md shadow-emerald-950/50'
                    : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                    }`}
                >
                  <div className="text-lg mb-1">🎬</div>
                  <div className="font-semibold text-sm text-slate-100">Screenplay</div>
                  <div className="text-xs text-slate-400 mt-1">Standard scene sluglines, character cues, dialogue parents.</div>
                </button>

                <button
                  type="button"
                  onClick={() => setProjectFormat('audio_drama')}
                  className={`p-4 rounded-xl border text-left transition-all ${projectFormat === 'audio_drama'
                    ? 'border-emerald-500 bg-emerald-950/20 shadow-md shadow-emerald-950/50'
                    : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                    }`}
                >
                  <div className="text-lg mb-1">🎙️</div>
                  <div className="font-semibold text-sm text-slate-100">Audio Drama</div>
                  <div className="text-xs text-slate-400 mt-1">Episodic layout formatted with SFX, ambient sound, and voice cues.</div>
                </button>

                <button
                  type="button"
                  onClick={() => setProjectFormat('novel')}
                  className={`p-4 rounded-xl border text-left transition-all ${projectFormat === 'novel'
                    ? 'border-emerald-500 bg-emerald-950/20 shadow-md shadow-emerald-950/50'
                    : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                    }`}
                >
                  <div className="text-lg mb-1">📖</div>
                  <div className="font-semibold text-sm text-slate-100">Prose / Novel</div>
                  <div className="text-xs text-slate-400 mt-1">Rich narrative descriptions, indented prose, and chapter breaks.</div>
                </button>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setOnboardingStage('QUESTIONS')}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleLaunchWorkspace}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors text-sm shadow-lg shadow-emerald-900/40"
                >
                  Launch Workspace →
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    )
  }
  const insertFormattingTag = (prefix: string, defaultText: string) => {
    setStoryCanvas((prev) => (prev || '') + `\n\n${prefix}${defaultText}`)
  }
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Left Sidebar */}
      {isSidebarOpen && (
        <aside className="w-72 bg-slate-900 border-r border-slate-800 p-4 flex flex-col justify-between shrink-0">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">
                📚 Chapter Manager
              </h2>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                ◀
              </button>
            </div>

            <form onSubmit={handleAddChapter} className="mb-6 flex gap-1.5">
              <input
                type="text"
                placeholder="New Chapter Title..."
                value={newChapterTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewChapterTitle(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 text-slate-200 px-2.5 py-1.5 rounded text-xs focus:outline-none focus:border-emerald-500"
                required
              />
              <button
                type="submit"
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded text-xs"
              >
                +
              </button>
            </form>

            <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-220px)]">
              {chapters.map((ch: Chapter) => (
                <div key={ch.id} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-xs text-slate-200">{ch.title}</span>
                    <button
                      onClick={() => handleAddScene(ch.id)}
                      className="text-[10px] text-emerald-400 hover:underline"
                    >
                      + Scene
                    </button>
                  </div>
                  <div className="space-y-1 pl-2">
                    {ch.scenes.map((sc: Scene) => (
                      <button
                        key={sc.id}
                        onClick={() => handleSelectScene(sc.id)}
                        className={`w-full text-left px-2 py-1 rounded text-xs transition-colors flex items-center justify-between ${activeSceneId === sc.id
                          ? 'bg-emerald-950 text-emerald-300 font-medium border border-emerald-800'
                          : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                          }`}
                      >
                        <span className="truncate">{sc.title}</span>
                        {activeSceneId === sc.id && <span className="text-[10px]">✏️</span>}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-slate-500 text-center pt-4 border-t border-slate-800">
            AuraStory Workspace v1.0
          </div>
        </aside>
      )}

      {/* Main Area */}
      <main className="flex-1 p-8 max-w-5xl mx-auto relative">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs"
              >
                ▶ Chapters
              </button>
            )}
            <h1 className="text-2xl font-bold text-emerald-400">AuraStory Editor</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="password"
              placeholder="Gemini API Key..."
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value)
                localStorage.setItem('aurastory_gemini_key', e.target.value)
              }}
              className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-44 transition-colors"
            />
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-blue-950 hover:bg-blue-900 text-blue-300 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5"
            >
              📇 Export
            </button>
            <button
              onClick={() => setIsScratchpadOpen(!isScratchpadOpen)}
              className="px-4 py-2 bg-purple-950 hover:bg-purple-900 text-purple-300 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5"
            >
              📜 Scratchpad
            </button>
            <button
              onClick={() => setIsWhatIfOpen(!isWhatIfOpen)}
              className="px-4 py-2 bg-amber-950 hover:bg-amber-900 text-amber-300 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5"
            >
              ⚡ What If?
            </button>
            <button
              onClick={() => setIsBibleOpen(!isBibleOpen)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5"
            >
              📖 Story Bible ({storyBible.length})
            </button>
          </div>
        </div>

        {/* Export Drawer */}
        {isExportOpen && (
          <div className="mb-8 p-5 bg-slate-900 border border-blue-500/40 rounded-xl shadow-2xl">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-semibold text-blue-300">📥 Manuscript & Lore Exporter</h2>
              <button onClick={() => setIsExportOpen(false)} className="text-slate-400 text-xs">
                ✕
              </button>
            </div>
            <div className="flex flex-wrap gap-3 mt-3">
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs"
              >
                📄 Download Full Manuscript (.txt)
              </button>
              <button
                onClick={handleExportLoreJSON}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-blue-300 rounded-lg text-xs border border-blue-800"
              >
                💾 Download Lore Bible (.json)
              </button>
            </div>
          </div>
        )}

        {/* Scratchpad Drawer */}
        {isScratchpadOpen && (
          <div className="mb-8 p-5 bg-slate-900 border border-purple-500/40 rounded-xl shadow-2xl">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-semibold text-purple-300">📝 Scratchpad</h2>
              <button onClick={() => setIsScratchpadOpen(false)} className="text-slate-400 text-xs">
                ✕
              </button>
            </div>
            <textarea
              value={scratchpadText}
              onChange={(e) => setScratchpadText(e.target.value)}
              className="w-full min-h-[250px] bg-slate-950/50 border border-slate-800 rounded-lg p-3 text-slate-200 text-sm focus:outline-none focus:border-emerald-500/50 resize-y"
              placeholder="Jot down notes, character ideas, or plot points here..."
            />
          </div>
        )}

        {/* What If Drawer */}
        {isWhatIfOpen && (
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl shadow-lg mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                ⚡ What If? Narrative Brainstormer
              </h2>
              <button
                onClick={() => setIsWhatIfOpen(false)}
                className="text-slate-500 hover:text-slate-300 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Enter a prompt or plot scenario (e.g., Jack finds the cipher)..."
                value={whatIfPrompt}
                onChange={(e) => setWhatIfPrompt(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={handleWhatIf}
                disabled={isGenerating}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 text-slate-950 font-semibold text-sm rounded-lg transition-colors"
              >
                {isGenerating ? 'Thinking...' : 'Explore'}
              </button>
            </div>

            {whatIfOutput && (
              <p className="text-xs text-amber-300 italic mb-3">{whatIfOutput}</p>
            )}

            {whatIfBranches.length > 0 && (
              <div className="space-y-2 mt-4">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Alternate Plot Branches</span>
                {whatIfBranches.map((branch, index) => (
                  <div
                    key={index}
                    className="p-3 bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded-lg flex justify-between items-center transition-all group"
                  >
                    <p className="text-xs text-slate-300 leading-relaxed pr-3">{branch}</p>
                    <button
                      onClick={() => setStoryCanvas((prev) => prev + `\n\n[Plot Twist]: ${branch}`)}
                      className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[11px] font-medium rounded whitespace-nowrap transition-colors"
                    >
                      + Insert to Canvas
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Story Bible Drawer */}
        {isBibleOpen && (
          <div className="mb-8 p-5 bg-slate-900 border border-emerald-500/40 rounded-xl shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold text-emerald-300">Story Bible</h2>
              <button onClick={() => setIsBibleOpen(false)} className="text-slate-400 text-xs">
                ✕
              </button>
            </div>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Entry Name (e.g. Jack)"
                value={newEntryName}
                onChange={(e) => setNewEntryName(e.target.value)}
                className="px-3 py-1 bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg flex-1"
              />
              <input
                type="text"
                placeholder="Details (e.g. Seeking medallion cipher)"
                value={newEntryState}
                onChange={(e) => setNewEntryState(e.target.value)}
                className="px-3 py-1 bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg flex-1"
              />
              <button
                onClick={handleAddBibleEntry}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-xs rounded-lg"
              >
                Add
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {storyBible.map((entry: BibleEntry, idx: number) => (
                <div key={idx} className="relative p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <button
                    onClick={() => handleDeleteBibleEntry(idx)}
                    className="absolute top-2 right-2 text-slate-500 hover:text-red-400 text-xs transition-colors"
                    title="Delete Entry"
                  >
                    ✕
                  </button>
                  <span className="font-bold text-xs text-slate-200">{entry.name}</span>
                  <p className="text-[11px] text-slate-400">{entry.current_state}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Canvas Editor */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl shadow-lg mb-8">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-100">
                Active Scene Canvas
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full border border-slate-700 bg-slate-800 text-slate-300 font-medium">
                {projectFormat === 'screenplay' && '🎬 Screenplay Mode'}
                {projectFormat === 'audio_drama' && '🎙️ Audio Drama Mode'}
                {projectFormat === 'novel' && '📖 Prose / Novel Mode'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleAutoContinueScene}
              disabled={isGenerating}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-semibold rounded-lg transition shadow-md cursor-pointer disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-1 h-3.5 w-3.5 text-slate-950"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Generating Beats...</span>
                </>
              ) : (
                <>
                  <span>✨ Auto-Continue Scene</span>
                </>
              )}
            </button>
          </div>

          {/* FORMAT-SPECIFIC TOOLBAR */}
          <div className="flex items-center gap-1.5 mb-3 p-1.5 bg-slate-900 border border-slate-800 rounded-lg">
            {projectFormat === 'screenplay' && (
              <>
                <span className="text-slate-500 px-2 font-mono text-[10px] uppercase tracking-wider">
                  FORMAT:
                </span>
                <button
                  type="button"
                  onClick={() => addBlockToActiveScene('SCENE_HEADING', 'INT. ')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition cursor-pointer"
                >
                  + INT.
                </button>
                <button
                  type="button"
                  onClick={() => addBlockToActiveScene('SCENE_HEADING', 'EXT. ')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition cursor-pointer"
                >
                  + EXT.
                </button>
                <button
                  type="button"
                  onClick={() => addBlockToActiveScene('CHARACTER', '')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-medium rounded text-xs transition cursor-pointer"
                >
                  + Character Cue
                </button>
                <button
                  type="button"
                  onClick={() => addBlockToActiveScene('PARENTHETICAL', '(')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded text-xs transition cursor-pointer"
                >
                  + (Parenthetical)
                </button>
              </>
            )}

            {projectFormat === 'audio_drama' && (
              <>
                <span className="text-slate-500 px-2 font-mono text-[10px] uppercase tracking-wider">
                  Audio Cues
                </span>
                <button
                  type="button"
                  onClick={() => insertFormattingTag('[SFX: ', 'Thunder rumble in distance]')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded font-mono text-xs"
                >
                  + [SFX]
                </button>
                <button
                  type="button"
                  onClick={() => insertFormattingTag('[MUSIC: ', 'Low tense synth pad builds]')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-purple-400 rounded font-mono text-xs"
                >
                  + [MUSIC]
                </button>
              </>
            )}

            {projectFormat === 'novel' && (
              <>
                <span className="text-slate-500 px-2 font-mono text-[10px] uppercase tracking-wider">
                  Prose
                </span>
                <button
                  type="button"
                  onClick={() => insertFormattingTag('\n***\n', '')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
                >
                  + Scene Break (***)
                </button>
              </>
            )}
          </div>

          <ScreenplayEditor
            blocks={getActiveBlocks()}
            onChange={handleUpdateActiveBlocks}
          />
        </div>
      </main>

      {/* RIGHT SIDEBAR: Scene Storyboard Visualizer */}
      <SceneVisualizer
        sceneTitle={activeScene?.title || 'Current Scene'}
        blocks={getActiveBlocks()}
        userTier="pro"
      />
    </div>
  );
}