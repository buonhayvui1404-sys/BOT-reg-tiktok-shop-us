import React from 'react';
import { VibeMode, VIBE_CONFIGS } from '../types';
import { Zap, Coffee, Cpu } from 'lucide-react';

interface VibeSelectorProps {
  currentVibe: VibeMode;
  onVibeChange: (vibe: VibeMode) => void;
}

const VibeSelector: React.FC<VibeSelectorProps> = ({ currentVibe, onVibeChange }) => {
  return (
    <div className="flex justify-center gap-2 mb-8 bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800/50 backdrop-blur-md inline-flex w-fit mx-auto">
      {(Object.keys(VIBE_CONFIGS) as VibeMode[]).map((mode) => {
        const config = VIBE_CONFIGS[mode];
        const isActive = currentVibe === mode;
        
        let Icon = Coffee;
        if (mode === VibeMode.TEN_X) Icon = Zap;
        if (mode === VibeMode.CYBERPUNK) Icon = Cpu;

        return (
          <button
            key={mode}
            onClick={() => onVibeChange(mode)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300
              ${isActive 
                ? `bg-slate-800 ${config.themeColor.replace('text-', 'text-').split(' ')[0]} shadow-lg ring-1 ring-inset ring-slate-700` 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
              }
            `}
          >
            <Icon size={16} />
            <span className={`${isActive ? '' : 'hidden sm:inline'}`}>{config.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default VibeSelector;