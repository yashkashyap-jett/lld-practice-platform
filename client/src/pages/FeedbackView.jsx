import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, CheckCircle, Zap, TrendingUp } from 'lucide-react';
import { getAttempt, createAttempt } from '../api';
import { ScoreRing } from '../components/ScoreRing';
import { CriterionCard } from '../components/CriterionCard';
import { ScoreComparison } from '../components/ImprovementBanner';
import { LoadingPage, ErrorState } from '../components/ui/States';

const FeedbackView = () => {
  const { id: attemptId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    getAttempt(attemptId)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [attemptId]);

  const handleRetry = async () => {
    try {
      setRetrying(true);
      const problemId = data.attempt.problemId?._id || data.attempt.problemId;
      const newAttempt = await createAttempt(problemId, attemptId);
      navigate(`/attempts/${newAttempt._id}/practice`);
    } catch (err) {
      setError(err.message);
      setRetrying(false);
    }
  };

  if (loading) return <LoadingPage message="Loading feedback..." />;
  if (error) return <ErrorState message={error} />;
  if (!data?.evaluation) {
    return <ErrorState message="No evaluation found. The attempt may still be processing." />;
  }

  const { attempt, evaluation, previousEvaluation } = data;
  const problem = attempt.problemId;

  // Redirect if not completed
  if (evaluation.status !== 'COMPLETED') {
    navigate(`/attempts/${attemptId}/evaluation`);
    return null;
  }

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/')} className="btn-ghost -ml-2">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </button>
        <button
          className="btn-primary"
          onClick={handleRetry}
          disabled={retrying}
        >
          <RotateCcw className="w-4 h-4" />
          {retrying ? 'Starting...' : 'Try Again'}
        </button>
      </div>

      {/* Score comparison if retry */}
      {previousEvaluation?.overallScore != null && (
        <div className="mb-6">
          <ScoreComparison
            previousScore={previousEvaluation.overallScore}
            newScore={evaluation.overallScore}
          />
        </div>
      )}

      {/* Hero score card */}
      <div className="card p-8 mb-6 flex flex-col md:flex-row items-center gap-8">
        <ScoreRing score={evaluation.overallScore} size={140} strokeWidth={10} />
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">{problem?.title}</p>
            {evaluation.evaluatorType === 'ai' && (
              <span className="badge bg-brand-900/40 text-brand-300 border border-brand-700/40">
                <Zap className="w-3 h-3 mr-1" /> AI Evaluated
              </span>
            )}
            {evaluation.evaluatorType === 'rule_based' && (
              <span className="badge bg-surface-700 text-gray-400 border border-white/10">
                Rule-Based
              </span>
            )}
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-3">Your Feedback</h1>
          <p className="text-gray-400 leading-relaxed">{evaluation.summary}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main — criteria */}
        <div className="lg:col-span-2 space-y-3">
          <p className="section-title">Rubric Breakdown</p>
          {evaluation.criteria?.map((criterion, i) => (
            <CriterionCard key={criterion.name} criterion={criterion} index={i} />
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Strengths */}
          {evaluation.strengths?.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Strengths</p>
              </div>
              <ul className="space-y-2">
                {evaluation.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Priority Improvements */}
          {evaluation.priorityImprovements?.length > 0 && (
            <div className="card p-5 border-amber-500/20">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Priority Improvements
                </p>
              </div>
              <ul className="space-y-3">
                {evaluation.priorityImprovements.map((item, i) => (
                  <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                    <span className="text-amber-400 font-bold flex-shrink-0">{i + 1}.</span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-5 pt-4 border-t border-white/[0.06]">
                <button
                  className="btn-primary w-full justify-center"
                  onClick={handleRetry}
                  disabled={retrying}
                >
                  <RotateCcw className="w-4 h-4" />
                  {retrying ? 'Starting...' : 'Try Again'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackView;
