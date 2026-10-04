import React, { useState } from 'react';

interface PremiseInputProps {
  onLoginSuccess?: (savedPrompt: string) => void;
  onSubmit?: () => void;
  initialValue?: string;
}

export const PremiseInput: React.FC<PremiseInputProps> = ({
  onLoginSuccess,
  onSubmit,
  initialValue = ''
}) => {
  const [premise, setPremise] = useState(initialValue);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onLoginSuccess) {
      onLoginSuccess(premise);
    }
    if (onSubmit) {
      onSubmit();
    }
  };

  return (
    <div className="space-y-4">
      <textarea
        value={premise}
        onChange={(e) => setPremise(e.target.value)}
        rows={7}
        placeholder="Describe your project concept, main idea, tone, or hook..."
        className="w-full bg-slate-950 text-slate-100 placeholder-slate-500 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-teal-500 resize-none text-left"
      />

      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={handleClick}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-1 transition-colors cursor-pointer"
        >
          ENTER ↵
        </button>
      </div>
    </div>
  );
};