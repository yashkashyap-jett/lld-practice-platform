import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, Lightbulb, Quote } from 'lucide-react';
import { MiniScoreBar } from './ScoreRing';

/**
 * CriterionCard — displays a single rubric criterion with score, evidence, concern, and suggestion.
 */
export const CriterionCard = ({ criterion, index }) => {
  const [expanded, setExpanded] = useState(index < 3); // first 3 expanded by default

  return (
    <div className="card border border-white/[0.06] overflow-hidden">
      {/* Header — always visible */}
      <button
        className="w-full p-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors text-left"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {String(index + 1).padStart(2, '0')}
            </span>
            <h4 className="font-semibold text-gray-200 text-sm">{criterion.name}</h4>
          </div>
          <MiniScoreBar score={criterion.score} />
        </div>
        <div className="text-gray-500 flex-shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/[0.04] pt-3 animate-fade-in">
          {/* Evidence */}
          {criterion.evidence && (
            <div className="flex gap-2.5 text-sm">
              <Quote className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-brand-400 mb-1">Evidence from your submission</p>
                <p className="text-gray-400 italic leading-relaxed">{criterion.evidence}</p>
              </div>
            </div>
          )}

          {/* Concern */}
          {criterion.concern && (
            <div className="flex gap-2.5 text-sm">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-400 mb-1">Concern</p>
                <p className="text-gray-400 leading-relaxed">{criterion.concern}</p>
              </div>
            </div>
          )}

          {/* Suggestion */}
          {criterion.suggestion && (
            <div className="flex gap-2.5 text-sm">
              <Lightbulb className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-emerald-400 mb-1">Suggestion</p>
                <p className="text-gray-400 leading-relaxed">{criterion.suggestion}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
