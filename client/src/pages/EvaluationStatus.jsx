import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { useEvaluationPoller } from '../hooks/useEvaluationPoller';
import { triggerEvaluation } from '../api';
import { LoadingSpinner } from '../components/ui/States';

const STATUS_STEPS = ['SUBMITTED', 'EVALUATING', 'COMPLETED'];

const StepIndicator = ({ steps, currentStatus }) => {
  const isFailed = currentStatus === 'FAILED';
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((step, i) => {
        const stepIndex = STATUS_STEPS.indexOf(step);
        const currentIndex = STATUS_STEPS.indexOf(currentStatus);
        const isActive = step === currentStatus && !isFailed;
        const isDone = currentIndex > stepIndex && !isFailed;
        const isFail = isFailed && step === 'EVALUATING';

        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isDone
                    ? 'bg-emerald-500 text-white'
                    : isActive
                    ? 'bg-brand-500 text-white animate-pulse-slow'
                    : isFail
                    ? 'bg-red-500 text-white'
                    : 'bg-surface-700 text-gray-600'
                }`}
              >
                {isDone ? (
                  <CheckCircle className="w-5 h-5" />
                ) : isActive ? (
                  <LoadingSpinner size="sm" />
                ) : isFail ? (
                  <XCircle className="w-5 h-5" />
                ) : (
                  <Clock className="w-5 h-5" />
                )}
              </div>
              <p className={`text-xs mt-2 font-medium ${isActive || isDone ? 'text-gray-200' : 'text-gray-600'}`}>
                {step === 'SUBMITTED' ? 'Submitted' : step === 'EVALUATING' ? 'Evaluating' : 'Completed'}
              </p>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 transition-all duration-500 ${
                  isDone ? 'bg-emerald-500' : 'bg-surface-600'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const EvaluationStatus = () => {
  const { id: attemptId } = useParams();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState(null);

  const handleUpdate = useCallback((eval_) => {
    setEvaluation(eval_);
  }, []);

  const isTerminal = evaluation?.status === 'COMPLETED' || evaluation?.status === 'FAILED';
  useEvaluationPoller(attemptId, handleUpdate, !isTerminal);

  const handleViewFeedback = () => navigate(`/attempts/${attemptId}/feedback`);

  const handleRetryEvaluation = async () => {
    try {
      setRetrying(true);
      setRetryError(null);
      await triggerEvaluation(attemptId);
      setEvaluation(null); // reset to re-poll
    } catch (err) {
      setRetryError(err.message);
    } finally {
      setRetrying(false);
    }
  };

  const currentStatus = evaluation?.status || 'SUBMITTED';

  return (
    <div className="page-container animate-fade-in">
      <div className="max-w-lg mx-auto">
        <div className="card p-8">
          <h1 className="text-2xl font-bold text-white text-center mb-2">Evaluating your design</h1>
          <p className="text-gray-400 text-center text-sm mb-8">
            Your submission is being reviewed against our LLD rubric
          </p>

          <StepIndicator steps={STATUS_STEPS} currentStatus={currentStatus} />

          {/* Status message */}
          <div className="text-center space-y-3">
            {currentStatus === 'SUBMITTED' && (
              <div className="animate-fade-in">
                <p className="text-gray-300 font-medium">Submission received</p>
                <p className="text-sm text-gray-500">Triggering evaluation engine...</p>
              </div>
            )}

            {currentStatus === 'EVALUATING' && (
              <div className="animate-fade-in">
                <p className="text-gray-300 font-medium">AI evaluation in progress</p>
                <p className="text-sm text-gray-500">
                  Gemini is reviewing your design against 8 rubric criteria.
                  <br />
                  This typically takes 10–30 seconds.
                </p>
                <div className="mt-4 flex justify-center">
                  <LoadingSpinner size="lg" />
                </div>
              </div>
            )}

            {currentStatus === 'COMPLETED' && (
              <div className="animate-fade-in">
                <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-3" />
                <p className="text-emerald-400 font-bold text-xl">
                  Score: {evaluation.overallScore?.toFixed(1)}/10
                </p>
                <p className="text-sm text-gray-400 mt-1 mb-6">
                  Evaluation complete! View detailed feedback below.
                </p>
                <button className="btn-primary" onClick={handleViewFeedback}>
                  View Full Feedback
                </button>
              </div>
            )}

            {currentStatus === 'FAILED' && (
              <div className="animate-fade-in">
                <XCircle className="w-16 h-16 text-red-400 mx-auto mb-3" />
                <p className="text-red-400 font-bold text-lg">Evaluation Failed</p>
                <p className="text-sm text-gray-400 mt-1 mb-2">
                  The evaluation encountered an error. Your submission is safe.
                </p>
                {evaluation?.error && (
                  <p className="text-xs text-gray-600 mb-4 font-mono bg-surface-700 p-2 rounded">
                    {evaluation.error}
                  </p>
                )}
                {retryError && (
                  <p className="text-sm text-red-400 mb-3">{retryError}</p>
                )}
                <button
                  className="btn-secondary"
                  onClick={handleRetryEvaluation}
                  disabled={retrying}
                >
                  {retrying ? <LoadingSpinner size="sm" /> : <RefreshCw className="w-4 h-4" />}
                  {retrying ? 'Retrying...' : 'Retry Evaluation'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Polling note */}
        {!isTerminal && (
          <p className="text-center text-xs text-gray-600 mt-4">
            Auto-refreshing every 3 seconds...
          </p>
        )}
      </div>
    </div>
  );
};

export default EvaluationStatus;
