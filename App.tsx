import React, { useState, useEffect } from 'react'
import './styles.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrainstormSandbox } from './BrainstormSandbox'

const queryClient = new QueryClient()

export default function App() {
  // 1. Initialize State with localStorage Fallbacks
  const [storyCanvas, setStoryCanvas] = useState(() => {
    return localStorage.getItem('aurastory_canvas') || 
      "The neon lights flickered across the wet pavement as the signal dropped. Elena Vance clutched the drive tightly.";
  });

  const [scratchpadText, setScratchpadText] = useState(() => {
    return localStorage.getItem('aurastory_scratchpad') || 
      "• Future Chapter Idea: Jack reveals a hidden cipher inside his medallion during the rooftop chase.\n• Clue: The transmission key only activates under rainfall.\n• Remember to check timeline consistency for Detective Miles before Scene 4.";
  });

  const [storyBible, setStoryBible] = useState(() => {
    const saved = localStorage.getItem('aurastory_bible');
    return saved ? JSON.parse(saved) : [
      {
        name: "Elena Vance",
        category: "Character",
        current_state: "Hiding a classified transmission code.",
        secrets_and_history: "Former lead cryptographer for the Syndicate."
      },
      {
        name: "The Neon Protocol",
        category: "World Lore",
        current_state: "Active across all sector nodes.",
        secrets_and_history: "Can be overridden only by a bloodline biometric key."
      }
    ];
  });

  // Drawer Toggles
  const [isBibleOpen, setIsBibleOpen] = useState(false);
  const [isWhatIfOpen, setIsWhatIfOpen] = useState(false);
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);

  // Form states
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Character");
  const [newStateStatus, setNewStateStatus] = useState("");
  const [newSecret, setNewSecret] = useState("");

  const [whatIfInput, setWhatIfInput] = useState("");
  const [whatIfBranches, setWhatIfBranches] = useState<string[]>([]);

  // 2. Automatically sync state to localStorage whenever changed
  useEffect(() => {
    localStorage.setItem('aurastory_canvas', storyCanvas);
  }, [storyCanvas]);

  useEffect(() => {
    localStorage.setItem('aurastory_scratchpad', scratchpadText);
  }, [scratchpadText]);

  useEffect(() => {
    localStorage.setItem('aurastory_bible', JSON.stringify(storyBible));
  }, [storyBible]);

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newEntry = {
      name: newName,
      category: newCategory,
      current_state: newStateStatus || "Active in current timeline",
      secrets_and_history: newSecret || "No public records found."
    };

    setStoryBible([...storyBible, newEntry]);
    setNewName("");
    setNewStateStatus("");
    setNewSecret("");
  };

  const handleAutoScanCanvas = () => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const autoExtractedEntry = {
      name: `Canvas Auto-Note (${timestamp})`,
      category: "World Lore",
      current_state: "Extracted dynamically from current draft excerpt.",
      secrets_and_history: `Source text snippet: "${storyCanvas.slice(0, 80)}..."`
    };

    setStoryBible(prev => [...prev, autoExtractedEntry]);
  };

  const handleGenerateWhatIf = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatIfInput.trim()) return;

    const scenarios = [
      `[Alt Branch 1] What if ${whatIfInput}? Suddenly, the transmission triggers an emergency blackout across the entire sector.`,
      `[Alt Branch 2] What if ${whatIfInput}? Elena realizes the data was a planted decoy designed to track her position.`,
      `[Alt Branch 3] What if ${whatIfInput}? An unexpected ally steps out from the shadows with a bypass key.`
    ];

    setWhatIfBranches(scenarios);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8 max-w-5xl mx-auto relative">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold text-emerald-400">AuraStory Workspace Active</h1>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => setIsScratchpadOpen(!isScratchpadOpen)}
              className="px-4 py-2 bg-purple-950 hover:bg-purple-900 text-purple-300 rounded-lg text-sm font-medium border border-purple-700/50 transition-colors"
            >
              📝 Scratchpad
            </button>
            <button 
              onClick={() => setIsWhatIfOpen(!isWhatIfOpen)}
              className="px-4 py-2 bg-amber-950 hover:bg-amber-900 text-amber-300 rounded-lg text-sm font-medium border border-amber-700/50 transition-colors"
            >
              ⚡ What If? Engine
            </button>
            <button 
              onClick={() => setIsBibleOpen(!isBibleOpen)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg text-sm font-medium border border-slate-700 transition-colors"
            >
              📖 Story Bible ({storyBible.length})
            </button>
          </div>
        </div>

        {/* Scratchpad Panel */}
        {isScratchpadOpen && (
          <div className="mb-8 p-5 bg-slate-900 border border-purple-500/40 rounded-xl shadow-2xl transition-all">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h2 className="text-lg font-semibold text-purple-300">📝 Future References & Scratchpad</h2>
                <p className="text-xs text-slate-400">Jot down plot reminders, future chapter notes, and raw ideas.</p>
              </div>
              <button onClick={() => setIsScratchpadOpen(false)} className="text-slate-400 hover:text-slate-200 text-sm">✕ Close</button>
            </div>

            <textarea 
              value={scratchpadText}
              onChange={(e) => setScratchpadText(e.target.value)}
              className="w-full h-36 bg-slate-950 text-purple-200 p-3 rounded-lg border border-purple-900/60 focus:outline-none focus:border-purple-500 font-mono text-xs leading-relaxed mb-3"
              placeholder="Write down future plot points, clues, scene ideas, or research notes..."
            />

            <div className="flex justify-between items-center">
              <span className="text-[11px] text-emerald-400">✓ Auto-saved locally</span>
              <button 
                onClick={() => setStoryCanvas(prev => prev + "\n\n[Scratchpad Note]:\n" + scratchpadText)}
                className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white font-semibold rounded-lg text-xs transition-colors"
              >
                Insert Notes into Main Canvas
              </button>
            </div>
          </div>
        )}

        {/* What If Scenario Drawer Panel */}
        {isWhatIfOpen && (
          <div className="mb-8 p-5 bg-slate-900 border border-amber-500/40 rounded-xl shadow-2xl transition-all">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-amber-300">⚡ "What If?" Plot Branch Generator</h2>
              <button onClick={() => setIsWhatIfOpen(false)} className="text-slate-400 hover:text-slate-200 text-sm">✕ Close</button>
            </div>

            <form onSubmit={handleGenerateWhatIf} className="mb-4 flex gap-2">
              <input 
                type="text" 
                placeholder="e.g. Elena fails to open the drive in time?" 
                value={whatIfInput}
                onChange={(e) => setWhatIfInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 text-slate-200 px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                required
              />
              <button 
                type="submit"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs transition-colors"
              >
                Explore Branches
              </button>
            </form>

            {whatIfBranches.length > 0 && (
              <div className="space-y-3 mt-4">
                <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Speculative Alternate Outcomes:</h3>
                {whatIfBranches.map((branch, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center gap-3">
                    <p className="text-xs text-slate-300 leading-relaxed flex-1">{branch}</p>
                    <button 
                      onClick={() => setStoryCanvas(prev => branch + "\n\n" + prev)}
                      className="px-3 py-1 bg-amber-950 hover:bg-amber-800 text-amber-300 border border-amber-700 rounded text-[11px] whitespace-nowrap"
                    >
                      Pull Branch to Canvas
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Story Bible Drawer Panel */}
        {isBibleOpen && (
          <div className="mb-8 p-5 bg-slate-900 border border-emerald-500/40 rounded-xl shadow-2xl transition-all">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-emerald-300">Story Bible & Lore Manager</h2>
              <button onClick={() => setIsBibleOpen(false)} className="text-slate-400 hover:text-slate-200 text-sm">✕ Close</button>
            </div>

            {/* Mode Selector / Action Bar */}
            <div className="flex flex-wrap gap-3 mb-6 p-3 bg-slate-950 rounded-xl border border-slate-800 items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Dual Extraction Mode</h3>
                <p className="text-[11px] text-slate-400">Add entries manually or auto-extract directly from your canvas draft.</p>
              </div>
              <button 
                onClick={handleAutoScanCanvas}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition-colors shadow-lg"
              >
                ✨ Auto-Scan Canvas & Extract
              </button>
            </div>

            {/* Manual Add Form */}
            <form onSubmit={handleAddEntry} className="mb-6 p-4 bg-slate-950 rounded-xl border border-slate-800">
              <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3">+ Manual Bible Entry Form</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <input 
                  type="text" 
                  placeholder="Name (e.g. Detective Miller)" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                />
                <select 
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="Character">Character</option>
                  <option value="World Lore">World Lore</option>
                  <option value="Faction">Faction</option>
                  <option value="Rule">Rule / Constraint</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <input 
                  type="text" 
                  placeholder="Current State / Status" 
                  value={newStateStatus}
                  onChange={(e) => setNewStateStatus(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                />
                <input 
                  type="text" 
                  placeholder="Secret or Hidden History" 
                  value={newSecret}
                  onChange={(e) => setNewSecret(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button 
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs transition-colors"
              >
                Save Manual Entry
              </button>
            </form>

            {/* Existing Entries Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {storyBible.map((entry, idx) => (
                <div key={idx} className="p-4 bg-slate-950 rounded-xl border border-slate-800 shadow-inner flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className="font-bold text-slate-100 text-sm">{entry.name}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-950 text-emerald-400 rounded-full border border-emerald-800 whitespace-nowrap">{entry.category}</span>
                    </div>
                    <p className="text-xs text-slate-300 mb-1"><strong>Status:</strong> {entry.current_state}</p>
                    <p className="text-xs text-slate-400"><strong>Secret:</strong> {entry.secrets_and_history}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Main Story Canvas Preview */}
        <div className="mb-8 p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
          <h2 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Main Story Canvas</h2>
          <textarea 
            value={storyCanvas}
            onChange={(e) => setStoryCanvas(e.target.value)}
            className="w-full h-40 bg-slate-950 text-slate-200 p-3 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500 font-mono text-sm leading-relaxed"
            placeholder="Pulled story content will appear here..."
          />
        </div>

        {/* Sandbox Component with Story Bible Context */}
        <BrainstormSandbox 
          open={true}
          onClose={() => console.log('Sandbox closed')}
          genreAndRules="Sci-Fi / Thriller rules: High stakes, fast pacing, twist endings."
          draftExcerpt={storyCanvas}
          bible={storyBible}
          onPull={(text) => {
            setStoryCanvas(prev => text + "\n\n" + prev);
          }}
        />
      </div>
    </QueryClientProvider>
  )
}