import React, { useState, useEffect } from 'react'
import './styles.css'

interface Scene {
  id: string
  title: string
  content: string
}

interface Chapter {
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

export default function App() {
  // 1. Chapters & Scenes State
  const [chapters, setChapters] = useState<Chapter[]>(() => {
    const saved = localStorage.getItem('aurastory_chapters')
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
              content:
                'The neon lights flickered across the wet pavement as the signal dropped. Elena Vance clutched the drive tightly.',
            },
            {
              id: 'sc-2',
              title: 'Scene 2: Encrypted Alleyway',
              content:
                'Rain heavy-poured into the alleyway. Jack stepped out from the shadows, holding a cipher medallion.',
            },
          ],
        },
      ]
  })
  const [isScratchpadOpen, setIsScratchpadOpen] = useState<boolean>(false)
  const [isBibleOpen, setIsBibleOpen] = useState<boolean>(false)
  const [isWhatIfOpen, setIsWhatIfOpen] = useState<boolean>(false)
  const [whatIfPrompt, setWhatIfPrompt] = useState<string>('')
  const [whatIfOutput, setWhatIfOutput] = useState<string>('')
  const [activeSceneId, setActiveSceneId] = useState<string>('sc-1')

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
  const handleWhatIf = () => {
    if (!whatIfPrompt.trim()) return
    setWhatIfOutput('Brainstorming narrative twists...')

    setTimeout(() => {
      setWhatIfOutput(
        `⚡ What If Scenario: "${whatIfPrompt}"\n\n` +
        `1. Twist: The central conflict shifts unexpectedly, forcing the protagonist to adapt.\n` +
        `2. Secret: A hidden motive is revealed from an unexpected ally.\n` +
        `3. Escalation: Time runs out faster than anticipated, escalating the stakes.`
      )
    }, 600)
  }
  const [scratchpadText, setScratchpadText] = useState<string>(() => {
    return (
      localStorage.getItem('aurastory_scratchpad') ||
      '• Future Chapter Idea: Jack reveals a hidden cipher inside his medallion.'
    )
  })

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
  const handleAddBibleEntry = () => {
  if (!newEntryName.trim()) return
  const newEntry = {
    name: newEntryName,
    category: 'General',
    current_state: newEntryState || 'Active',
    secrets_and_history: ''
  }
  setStoryBible((prev) => [...prev, newEntry])
  setNewEntryName('')
  setNewEntryState('')
}
  // Gemini State
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('aurastory_gemini_key') || '')
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [whatIfInput, setWhatIfInput] = useState<string>('')
  const [whatIfBranches, setWhatIfBranches] = useState<string[]>([])
  const [newChapterTitle, setNewChapterTitle] = useState<string>('')

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

  const handleSelectScene = (scene: Scene) => {
    setActiveSceneId(scene.id)
    setStoryCanvas(scene.content)
  }

  const handleAddChapter = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newChapterTitle.trim()) return

    const newChId = `ch-${Date.now()}`
    const newScId = `sc-${Date.now()}`
    const newCh: Chapter = {
      id: newChId,
      title: newChapterTitle,
      scenes: [{ id: newScId, title: 'Scene 1: Introduction', content: 'Write scene draft here...' }],
    }

    setChapters([...chapters, newCh])
    setNewChapterTitle('')
    setActiveSceneId(newScId)
    setStoryCanvas('Write scene draft here...')
  }

  const handleAddScene = (chapterId: string) => {
    const newScId = `sc-${Date.now()}`
    const newSceneName = prompt('Enter Scene Title:', 'New Scene')
    if (!newSceneName) return

    setChapters((prev: Chapter[]) =>
      prev.map((ch: Chapter) => {
        if (ch.id === chapterId) {
          return {
            ...ch,
            scenes: [...ch.scenes, { id: newScId, title: newSceneName, content: '' }],
          }
        }
        return ch
      })
    )
    setActiveSceneId(newScId)
    setStoryCanvas('')
  }

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

    if (!apiKey.trim()) {
      setWhatIfBranches([
        `[Alt Branch 1] What if ${whatIfInput}? Suddenly, the transmission triggers an emergency blackout across the sector.`,
        `[Alt Branch 2] What if ${whatIfInput}? Elena realizes the data was a planted decoy designed to track her position.`,
        `[Alt Branch 3] What if ${whatIfInput}? An unexpected ally steps out from the shadows with a bypass key.`,
      ])
      return
    }

    setIsGenerating(true)
    try {
      const promptText = `You are a professional creative writing assistant for a story workspace. 
Current Story Context: "${storyCanvas.slice(-300)}"
Speculative "What If?" Premise: "${whatIfInput}"
Generate exactly 3 distinct plot branches as a JSON array of strings.`

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] }),
        }
      )

      const data = await response.json()
      const rawResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      const cleaned = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim()
      const parsedBranches = JSON.parse(cleaned)

      if (Array.isArray(parsedBranches)) {
        setWhatIfBranches(parsedBranches)
      } else {
        setWhatIfBranches([rawResponse])
      }
    } catch (err) {
      console.error('Gemini API Error:', err)
      setWhatIfBranches([
        `[Live Twist 1] What if ${whatIfInput}? An unexpected signal override redirects the transmission.`,
        `[Live Twist 2] What if ${whatIfInput}? Elena discovers an encrypted file header matching her father's initials.`,
      ])
    } finally {
      setIsGenerating(false)
    }
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
                        onClick={() => handleSelectScene(sc)}
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

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="px-4 py-2 bg-blue-950 hover:bg-blue-900 text-blue-300 rounded-lg text-xs font-medium border border-blue-700/50"
            >
              📥 Export
            </button>
            <button
              onClick={() => setIsScratchpadOpen(!isScratchpadOpen)}
              className="px-4 py-2 bg-purple-950 hover:bg-purple-900 text-purple-300 rounded-lg text-xs font-medium border border-purple-700/50"
            >
              📝 Scratchpad
            </button>
            <button
              onClick={() => setIsWhatIfOpen(!isWhatIfOpen)}
              className="px-4 py-2 bg-amber-950 hover:bg-amber-900 text-amber-300 rounded-lg text-xs font-medium border border-amber-700/50"
            >
              ⚡ What If?
            </button>
            <button
              onClick={() => setIsBibleOpen(!isBibleOpen)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg text-xs font-medium border border-slate-700"
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
              placeholder="The neon lights flickered across the wet pavement as the signal dropped."
              className="..." // keep your existing className styles
            />
          </div>
        )}

        {/* What If Drawer */}
        {isWhatIfOpen && (
          <div className="mb-8 p-5 bg-slate-900 border border-amber-500/40 rounded-xl shadow-2xl">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-semibold text-amber-300">⚡ "What If?" Engine</h2>
              <button onClick={() => setIsWhatIfOpen(false)} className="text-slate-400 text-xs">
                ✕
              </button>
            </div>
            <div className="mb-4 flex gap-2">
              <input
                type="text"
                placeholder="Enter Gemini API Key (optional)..."
                value={apiKey}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApiKey(e.target.value)}
                className="w-1/3 bg-slate-950 border border-slate-700 text-slate-300 px-3 py-1.5 rounded text-xs"
              />
              <form onSubmit={(e) => { e.preventDefault(); handleWhatIf(); }} className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. What if Elena fails to open the drive in time?"
                  value={whatIfPrompt}
                  onChange={(e) => setWhatIfPrompt(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 text-slate-200 px-3 py-1.5 rounded text-xs"
                  required
                />
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded text-xs"
                >
                  {isGenerating ? '...' : 'Explore'}
                </button>
              </form>
              {whatIfOutput && (
                <div className="mt-4 p-4 bg-slate-950/70 border border-amber-500/30 rounded-lg text-amber-200 text-sm whitespace-pre-wrap">
                  {whatIfOutput}
                </div>
              )}
            </div>
            {whatIfBranches.map((branch: string, idx: number) => (
              <div key={idx} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 mb-2 flex justify-between items-center gap-2">
                <p className="text-xs text-slate-300 flex-1">{branch}</p>
                <button
                  onClick={() => setStoryCanvas((prev: string) => branch + '\n\n' + prev)}
                  className="px-2.5 py-1 bg-amber-950 text-amber-300 border border-amber-800 rounded text-[10px]"
                >
                  Pull
                </button>
              </div>
            ))}
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
                <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="font-bold text-xs text-slate-200">{entry.name}</span>
                  <p className="text-[11px] text-slate-400">{entry.current_state}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Canvas Editor */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl shadow-lg mb-8">
          <h2 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">
            Active Scene Canvas
          </h2>
          <textarea
            value={storyCanvas}
            onChange={(e) => setStoryCanvas(e.target.value)}
            placeholder="The neon lights flickered across the wet pavement as the signal dropped."
            className="w-full h-64 bg-transparent text-slate-100 placeholder:text-slate-500 outline-none resize-none"
          />
        </div>
      </main>
    </div>
  )
}