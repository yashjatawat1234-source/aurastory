import React, { useState } from 'react';

interface PremiseInputProps {
  onLoginSuccess?: (promptText: string) => void;
}

export function PremiseInput({ onLoginSuccess }: PremiseInputProps) {
  const [prompt, setPrompt] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const triggerSubmit = () => {
    if (!prompt.trim()) return;
    sessionStorage.setItem('pending_premise', prompt);
    setIsModalOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      triggerSubmit();
    }
  };

  const handleAuth = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const savedPremise = sessionStorage.getItem('pending_premise') || prompt;

    if (onLoginSuccess) {
      onLoginSuccess(savedPremise);
    }

    sessionStorage.removeItem('pending_premise');
    setIsModalOpen(false);
    setShowEmailForm(false);
    setPrompt('');
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-2 relative">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Describe your project concept, main idea, tone, or opening hook..."
        rows={3}
        className="w-full p-4 bg-slate-950/60 text-slate-100 border border-slate-800 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
      />

      {/* Visible ENTER Button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={triggerSubmit}
          disabled={!prompt.trim()}
          className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-lg transition flex items-center gap-2"
        >
          ENTER ↵
        </button>
      </div>

      {/* Auth Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full shadow-2xl relative text-slate-100 animate-in fade-in zoom-in-95">
            <button
              onClick={() => {
                setIsModalOpen(false);
                setShowEmailForm(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 text-xl font-bold"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold mb-2 text-white">Save Your Concept</h2>
            <p className="text-slate-400 mb-6 text-sm">
              Log in or sign up to generate your screenplay workspace and process your premise.
            </p>

            {!showEmailForm ? (
              <div className="space-y-3">
                <button
                  onClick={() => handleAuth()}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition"
                >
                  Continue with Google
                </button>
                <button
                  onClick={() => setShowEmailForm(true)}
                  className="w-full py-3 border border-slate-700 hover:bg-slate-800 text-slate-200 font-medium rounded-xl transition"
                >
                  Continue with Email
                </button>
              </div>
            ) : (
              <form onSubmit={handleAuth} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="writer@studio.com"
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition mt-2"
                >
                  Sign In & Continue
                </button>

                <button
                  type="button"
                  onClick={() => setShowEmailForm(false)}
                  className="w-full text-xs text-slate-400 hover:text-slate-200 text-center mt-2"
                >
                  ← Back to options
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}