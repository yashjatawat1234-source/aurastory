import React, { useState } from 'react';

interface PremiseInputProps {
  onLoginSuccess: (prompt: string) => void;
  onSubmit: () => void;
}

export const PremiseInput: React.FC<PremiseInputProps> = ({ onLoginSuccess, onSubmit }) => {
  const [prompt, setPrompt] = useState('');

  const wordCount = prompt.trim() ? prompt.trim().split(/\s+/).length : 0;

  const handleSubmit = () => {
    if (!prompt.trim()) return;
    onLoginSuccess(prompt);
    onSubmit();
  };

  return (
    <div className="relative w-full bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe your project concept, main idea, tone, or hook..."
        className="w-full h-40 bg-transparent text-white placeholder-slate-500 resize-none focus:outline-none text-sm"
      />

      <div className="flex items-center justify-between pt-2 border-t border-slate-900">
        <div className="text-xs text-slate-500">
          💡 <span className="text-slate-400 font-medium">Tip:</span> Aim for 500 words for optimal AI story structure parsing ({wordCount}/500 words)
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-1 cursor-pointer"
        >
          ENTER ↵
        </button>
      </div>
    </div>
  );
};