import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import { DifficultyBadge } from './AttemptStatusBadge';

export const ProblemCard = ({ problem, recentAttempt }) => {
  const navigate = useNavigate();

  return (
    <div
      className="card-hover cursor-pointer p-6 flex flex-col gap-4 animate-slide-up"
      onClick={() => navigate(`/problems/${problem._id}`)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-100 text-lg leading-snug">{problem.title}</h3>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{problem.description}</p>
        </div>
        <DifficultyBadge difficulty={problem.difficulty} />
      </div>

      {/* Tags */}
      {problem.tags && problem.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {problem.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded text-xs font-medium bg-brand-900/40 text-brand-300 border border-brand-800/40"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Requirements count */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>{problem.requirements?.length || 0} requirements</span>
        <span>{problem.constraints?.length || 0} constraints</span>
      </div>

      {/* Recent attempt */}
      {recentAttempt && (
        <div className="border-t border-white/[0.06] pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            <span>
              Last attempt:{' '}
              <span
                className={
                  recentAttempt.status === 'COMPLETED'
                    ? 'text-emerald-400 font-semibold'
                    : 'text-amber-400'
                }
              >
                {recentAttempt.evaluation?.overallScore != null
                  ? `${recentAttempt.evaluation.overallScore}/10`
                  : recentAttempt.status}
              </span>
            </span>
          </div>
          <span className="text-xs text-gray-600">
            {new Date(recentAttempt.createdAt).toLocaleDateString()}
          </span>
        </div>
      )}

      {/* CTA */}
      <button className="btn-primary w-full justify-center mt-auto" onClick={(e) => {
        e.stopPropagation();
        navigate(`/problems/${problem._id}`);
      }}>
        {recentAttempt ? 'Practice Again' : 'Start Practice'}
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
