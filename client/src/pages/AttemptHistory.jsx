import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, ExternalLink, BookOpen } from 'lucide-react';
import { getAttempts } from '../api';
import { AttemptStatusBadge, DifficultyBadge } from '../components/AttemptStatusBadge';
import { LoadingPage, EmptyState, ErrorState } from '../components/ui/States';

const AttemptHistory = () => {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAttempts()
      .then(setAttempts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleViewAttempt = (attempt) => {
    if (attempt.status === 'COMPLETED') {
      navigate(`/attempts/${attempt._id}/feedback`);
    } else if (['SUBMITTED', 'EVALUATING', 'FAILED'].includes(attempt.status)) {
      navigate(`/attempts/${attempt._id}/evaluation`);
    } else {
      navigate(`/attempts/${attempt._id}/practice`);
    }
  };

  if (loading) return <LoadingPage message="Loading history..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <History className="w-6 h-6 text-brand-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Attempt History</h1>
          <p className="text-sm text-gray-500 mt-0.5">All your practice attempts across all problems</p>
        </div>
      </div>

      {attempts.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No attempts yet"
          description="Start practicing to see your history here. Each attempt is saved with full feedback."
          action={
            <button className="btn-primary" onClick={() => navigate('/')}>
              Browse Problems
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {attempts.map((attempt) => {
            const problem = attempt.problemId;
            const score = attempt.evaluation?.overallScore;
            const date = new Date(attempt.createdAt);

            return (
              <div
                key={attempt._id}
                className="card-hover p-5 cursor-pointer flex items-center gap-4"
                onClick={() => handleViewAttempt(attempt)}
              >
                {/* Score indicator */}
                <div
                  className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 font-bold ${
                    score != null
                      ? score >= 8
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : score >= 6
                        ? 'bg-brand-500/10 text-brand-400'
                        : score >= 4
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-red-500/10 text-red-400'
                      : 'bg-surface-700 text-gray-500'
                  }`}
                >
                  {score != null ? (
                    <>
                      <span className="text-lg leading-tight">{score.toFixed(1)}</span>
                      <span className="text-xs opacity-60">/10</span>
                    </>
                  ) : (
                    <span className="text-xl">—</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-200 truncate">{problem?.title || 'Unknown Problem'}</p>
                    {problem?.difficulty && <DifficultyBadge difficulty={problem.difficulty} />}
                  </div>
                  <div className="flex items-center gap-3">
                    <AttemptStatusBadge status={attempt.status} />
                    <span className="text-xs text-gray-600">
                      {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {' · '}
                      {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {attempt.previousAttemptId && (
                      <span className="text-xs text-brand-400 font-medium">↩ Retry</span>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <ExternalLink className="w-4 h-4 text-gray-600 flex-shrink-0" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AttemptHistory;
