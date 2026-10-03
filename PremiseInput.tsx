import React, { useState } from 'react';

interface PremiseInputProps {
  onNext?: (premise: string) => void;
  onLoginSuccess?: (savedPrompt: string) => void;
  initialValue?: string;
}

export const PremiseInput: React.FC<PremiseInputProps> = ({
  onNext,
  onLoginSuccess,
  initialValue = ''
}) => {
  const [premise, setPremise] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!premise.trim()) return;

    if (onLoginSuccess) {
      onLoginSuccess(premise);
    } else if (onNext) {
      onNext(premise);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Textarea Input */}
      <textarea
        value={premise}
        onChange={(e) => setPremise(e.target.value)}
        rows={7}
        placeholder="Describe your project concept, main idea, tone, or hook... (Tip: Share ~500 words about your story, style, and vision so AI can match your voice across all features)"
        className="w-full bg-[#090d16] text-slate-100 placeholder-slate-500 border border-slate-800 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent resize-none transition-all text-sm leading-relaxed"
      />

      {/* Action Row with ENTER button */}
      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={!premise.trim()}
          className="bg-[#059669] hover:bg-[#10b981] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold py-2.5 px-6 rounded-lg transition-all tracking-wider flex items-center gap-1.5 uppercase shadow-lg shadow-emerald-950/40"
        >
          ENTER ↵
        </button>
      </div>
    </form>
  );
};