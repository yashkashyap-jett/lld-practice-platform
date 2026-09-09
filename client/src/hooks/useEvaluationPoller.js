import { useEffect, useRef, useCallback } from 'react';
import { getEvaluation } from '../api';

/**
 * useEvaluationPoller — polls /api/attempts/:id/evaluation every 3s
 * until the evaluation reaches a terminal state (COMPLETED or FAILED).
 *
 * @param {string} attemptId
 * @param {function} onUpdate - called with the evaluation doc on each poll
 * @param {boolean} active - set to false to stop polling
 */
export const useEvaluationPoller = (attemptId, onUpdate, active = true) => {
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);

  const poll = useCallback(async () => {
    try {
      const evaluation = await getEvaluation(attemptId);
      if (!isMountedRef.current) return;

      onUpdate(evaluation);

      // Stop polling when terminal
      if (
        evaluation &&
        (evaluation.status === 'COMPLETED' || evaluation.status === 'FAILED')
      ) {
        clearInterval(intervalRef.current);
      }
    } catch (err) {
      console.warn('[Poller] Error fetching evaluation:', err.message);
    }
  }, [attemptId, onUpdate]);

  useEffect(() => {
    isMountedRef.current = true;
    if (!active || !attemptId) return;

    // Poll immediately, then every 3s
    poll();
    intervalRef.current = setInterval(poll, 3000);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalRef.current);
    };
  }, [attemptId, active, poll]);
};
