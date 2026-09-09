import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, ChevronRight } from 'lucide-react';
import { getProblem, createAttempt } from '../api';
import { DifficultyBadge } from '../components/AttemptStatusBadge';
import { LoadingPage, ErrorState } from '../components/ui/States';

const ProblemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getProblem(id)
      .then(setProblem)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStart = async () => {
    try {
      setStarting(true);
      const attempt = await createAttempt(id);
      navigate(`/attempts/${attempt._id}/practice`);
    } catch (err) {
      setError(err.message);
      setStarting(false);
    }
  };

  if (loading) return <LoadingPage message="Loading problem..." />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!problem) return null;

  return (
    <div className="page-container animate-fade-in">
      {/* Back */}
      <button onClick={() => navigate('/')} className="btn-ghost mb-6 -ml-2">
        <ArrowLeft className="w-4 h-4" /> Back to Problems
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <DifficultyBadge difficulty={problem.difficulty} />
            {problem.tags?.slice(0, 3).map((tag) => (
              <span key={tag} className="px-2 py-0.5 rounded text-xs font-medium bg-brand-900/40 text-brand-300 border border-brand-800/40">
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-3xl font-extrabold text-white">{problem.title}</h1>
        </div>
        <button
          className="btn-primary flex-shrink-0"
          onClick={handleStart}
          disabled={starting}
        >
          {starting ? 'Starting...' : 'Start Practice'}
          {!starting && <Play className="w-4 h-4" />}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main — description */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="card p-6">
            <p className="section-title">Problem Description</p>
            <p className="text-gray-300 leading-relaxed">{problem.description}</p>
          </div>

          {/* Requirements */}
          <div className="card p-6">
            <p className="section-title">Requirements</p>
            <ul className="space-y-2.5">
              {problem.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                  <ChevronRight className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
                  {req}
                </li>
              ))}
            </ul>
          </div>

          {/* Constraints */}
          <div className="card p-6">
            <p className="section-title">Constraints</p>
            <ul className="space-y-2.5">
              {problem.constraints.map((c, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-2" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sidebar — expected considerations */}
        <div className="space-y-6">
          <div className="card p-6">
            <p className="section-title">Expected Considerations</p>
            <p className="text-xs text-gray-500 mb-4">
              Hint: these are areas the evaluator will look for in your design.
            </p>
            <ul className="space-y-3">
              {problem.expectedConsiderations.map((c, i) => (
                <li key={i} className="text-sm text-gray-400 flex items-start gap-2 border-b border-white/[0.04] pb-3 last:border-0 last:pb-0">
                  <span className="text-brand-400 font-bold flex-shrink-0">{i + 1}.</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>

          {/* CTA card */}
          <div className="card p-6 bg-brand-900/20 border-brand-700/30">
            <p className="font-semibold text-brand-300 mb-2">Ready to design?</p>
            <p className="text-sm text-gray-400 mb-4">
              You'll fill out 8 sections covering classes, responsibilities, interfaces, 
              patterns, and more.
            </p>
            <button className="btn-primary w-full justify-center" onClick={handleStart} disabled={starting}>
              {starting ? 'Starting...' : 'Start Practice'}
              {!starting && <Play className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemDetail;
