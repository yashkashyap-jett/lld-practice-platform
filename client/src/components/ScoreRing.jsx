import React from 'react';

/**
 * ScoreRing — circular SVG score display.
 * Renders a ring that fills proportionally to score/10.
 */
export const ScoreRing = ({ score, size = 120, strokeWidth = 8 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const fill = score != null ? Math.max(0, Math.min(10, score)) / 10 : 0;
  const strokeDashoffset = circumference * (1 - fill);

  const getColor = (s) => {
    if (s == null) return '#4b5563';
    if (s >= 8) return '#10b981';  // emerald
    if (s >= 6) return '#3b82f6';  // blue
    if (s >= 4) return '#f59e0b';  // amber
    return '#ef4444';              // red
  };

  const color = getColor(score);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease-out, stroke 0.3s' }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>
          {score != null ? score.toFixed(1) : '—'}
        </span>
        <span className="text-xs text-gray-500 font-medium">/ 10</span>
      </div>
    </div>
  );
};

/**
 * MiniScoreBar — inline horizontal bar for criterion scores.
 */
export const MiniScoreBar = ({ score }) => {
  const pct = (score / 10) * 100;
  const color =
    score >= 8 ? 'bg-emerald-500' : score >= 6 ? 'bg-brand-500' : score >= 4 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-bold text-gray-200 w-8 text-right">{score}/10</span>
    </div>
  );
};
