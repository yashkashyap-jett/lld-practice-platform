import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

/**
 * ImprovementBanner — shown when retrying, displays previous attempt's priority improvements.
 */
export const ImprovementBanner = ({ improvements }) => {
  if (!improvements || improvements.length === 0) return null;
  return (
    <div className="card border border-amber-500/20 bg-amber-500/5 p-5 mb-6 animate-slide-up">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-amber-400 text-sm font-bold uppercase tracking-wider">
          💡 Your Priority Improvements from Last Attempt
        </span>
      </div>
      <ul className="space-y-2">
        {improvements.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
            <span className="text-amber-400 font-bold flex-shrink-0">{i + 1}.</span>
            {item}
          </li>
        ))}
      </ul>
      <p className="text-xs text-gray-500 mt-3 border-t border-white/[0.06] pt-3">
        Address these areas in your redesign to improve your score.
      </p>
    </div>
  );
};

/**
 * ScoreComparison — shown after retry completion: "Previous: 7.2 → New: 8.4 (+1.2)"
 */
export const ScoreComparison = ({ previousScore, newScore }) => {
  if (previousScore == null || newScore == null) return null;

  const diff = Math.round((newScore - previousScore) * 10) / 10;
  const improved = diff > 0;
  const same = diff === 0;

  return (
    <div
      className={`card p-5 flex items-center justify-center gap-6 ${
        improved ? 'border-emerald-500/20 bg-emerald-500/5' : same ? 'border-gray-500/20' : 'border-red-500/20 bg-red-500/5'
      }`}
    >
      <div className="text-center">
        <p className="text-xs text-gray-500 mb-1">Previous</p>
        <p className="text-2xl font-bold text-gray-300">{previousScore.toFixed(1)}</p>
      </div>

      <div className="text-gray-600 text-2xl">→</div>

      <div className="text-center">
        <p className="text-xs text-gray-500 mb-1">New Score</p>
        <p className={`text-2xl font-bold ${improved ? 'text-emerald-400' : same ? 'text-gray-300' : 'text-red-400'}`}>
          {newScore.toFixed(1)}
        </p>
      </div>

      <div
        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold ${
          improved ? 'bg-emerald-500/15 text-emerald-400' : same ? 'bg-gray-700 text-gray-400' : 'bg-red-500/15 text-red-400'
        }`}
      >
        {improved ? <ArrowUp className="w-4 h-4" /> : same ? <Minus className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
        {improved ? '+' : ''}{diff.toFixed(1)}
      </div>
    </div>
  );
};
