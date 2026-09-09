import React from 'react';

const STATUS_CONFIG = {
  IN_PROGRESS: { label: 'In Progress', className: 'badge-in-progress' },
  SUBMITTED: { label: 'Submitted', className: 'badge-submitted' },
  EVALUATING: { label: 'Evaluating', className: 'badge-evaluating' },
  COMPLETED: { label: 'Completed', className: 'badge-completed' },
  FAILED: { label: 'Failed', className: 'badge-failed' },
};

const DIFFICULTY_CONFIG = {
  Easy: { className: 'badge-easy' },
  Medium: { className: 'badge-medium' },
  Hard: { className: 'badge-hard' },
};

export const AttemptStatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || { label: status, className: 'badge bg-gray-700 text-gray-300' };
  return (
    <span className={config.className}>
      {status === 'EVALUATING' && (
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse mr-1.5" />
      )}
      {config.label}
    </span>
  );
};

export const DifficultyBadge = ({ difficulty }) => {
  const config = DIFFICULTY_CONFIG[difficulty] || { className: 'badge bg-gray-700 text-gray-300' };
  return <span className={config.className}>{difficulty}</span>;
};
