import React from 'react';
import { HistoryEntry } from '../types';
import { SodaCan } from './SodaCan';
import { CheckCircle2, Circle } from 'lucide-react';

interface HistoryRowProps {
  entry: HistoryEntry;
  index: number;
}

export const HistoryRow: React.FC<HistoryRowProps> = ({ entry, index }) => {
  return (
    <div className="group flex items-center gap-2 p-2 border-b border-slate-300/50 last:border-0 hover:bg-slate-100/50 transition-colors">
      <div className="flex flex-col items-center justify-center min-w-[2rem]">
        <span className="text-xs text-slate-400 font-mono font-bold">#{index + 1}</span>
      </div>
      
      <div className="flex-1 flex justify-center gap-1">
        {entry.arrangement.map((brandId, i) => (
          <div key={i} className="transform scale-[0.6] origin-center -mx-1">
            <SodaCan brandId={brandId} size="sm" disabled />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1 min-w-[3.5rem] justify-end">
        {entry.correctCount === entry.arrangement.length ? (
           <CheckCircle2 size={18} className="text-emerald-600" />
        ) : (
           <Circle size={12} className="text-slate-300 fill-slate-300" />
        )}
        <span className={`text-sm font-bold font-mono ${entry.correctCount === 5 ? 'text-emerald-600' : 'text-slate-600'}`}>
          {entry.correctCount}
        </span>
      </div>
    </div>
  );
};