import React, { useEffect, useState } from 'react';
import { BookOpen, Target, TrendingUp } from 'lucide-react';
import { getProblems, getAttempts } from '../api';
import { ProblemCard } from '../components/ProblemCard';
import { LoadingPage, ErrorState } from '../components/ui/States';

const Dashboard = () => {
  const [problems, setProblems] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [probs, atts] = await Promise.all([getProblems(), getAttempts()]);
      setProblems(probs);
      setAttempts(atts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingPage message="Loading problems..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  // Build a map: problemId → most recent attempt for this session
  const latestAttemptByProblem = {};
  attempts.forEach((a) => {
    const pid = a.problemId?._id || a.problemId;
    if (!latestAttemptByProblem[pid]) {
      latestAttemptByProblem[pid] = a;
    }
  });

  // Stats
  const completedCount = attempts.filter((a) => a.status === 'COMPLETED').length;
  const avgScore =
    completedCount > 0
      ? (
          attempts
            .filter((a) => a.evaluation?.overallScore != null)
            .reduce((s, a) => s + a.evaluation.overallScore, 0) / completedCount
        ).toFixed(1)
      : null;

  return (
    <div className="page-container animate-fade-in">
      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-gradient mb-3">
          LLD Practice Platform
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl">
          Master Low-Level Design through structured practice. Design, submit, get AI-powered 
          feedback, and iterate until your designs are solid.
        </p>
      </div>

      {/* Stats bar */}
      {attempts.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { icon: BookOpen, label: 'Attempts', value: attempts.length, color: 'text-brand-400' },
            { icon: Target, label: 'Completed', value: completedCount, color: 'text-emerald-400' },
            { icon: TrendingUp, label: 'Avg Score', value: avgScore ? `${avgScore}/10` : '—', color: 'text-amber-400' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="card p-4 flex items-center gap-3">
              <Icon className={`w-5 h-5 ${color}`} />
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Problems */}
      <div className="mb-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-6">
          Available Problems
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {problems.map((problem) => (
            <ProblemCard
              key={problem._id}
              problem={problem}
              recentAttempt={latestAttemptByProblem[problem._id] || null}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
