import React from 'react';

export type AnalysisStatus = 'Queued' | 'Running' | 'Completed' | 'Partially completed' | 'Failed' | 'Cancelled';

interface StatusIndicatorProps {
  status: AnalysisStatus | string;
  metadata?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  metadata,
  size = 'md',
  className = '',
}) => {
  const norm = (status || 'Queued').toLowerCase();

  let dotColor = 'bg-muted';
  let textColor = 'text-muted';
  let label = status;
  let isPulse = false;

  if (norm.includes('run')) {
    dotColor = 'bg-amber';
    textColor = 'text-amber';
    label = 'Running';
    isPulse = true;
  } else if (norm.includes('complete') || norm.includes('success')) {
    dotColor = 'bg-forest';
    textColor = 'text-forest';
    label = 'Completed';
  } else if (norm.includes('fail') || norm.includes('err')) {
    dotColor = 'bg-clay';
    textColor = 'text-clay font-semibold';
    label = 'Failed';
  } else if (norm.includes('partial')) {
    dotColor = 'bg-amber';
    textColor = 'text-amber';
    label = 'Partially completed';
  } else if (norm.includes('cancel')) {
    dotColor = 'bg-muted';
    textColor = 'text-muted';
    label = 'Cancelled';
  } else {
    dotColor = 'bg-muted';
    textColor = 'text-muted';
    label = 'Queued';
  }

  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';

  return (
    <div className={`inline-flex items-center gap-2 ${textSize} ${className}`}>
      <span className="relative flex items-center justify-center">
        {isPulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`}
          />
        )}
        <span className={`inline-block rounded-full ${dotSize} ${dotColor}`} />
      </span>
      <span className={`font-sans ${textColor}`}>{label}</span>
      {metadata && (
        <span className="font-mono text-muted text-[10px] pl-1 border-l border-line">
          {metadata}
        </span>
      )}
    </div>
  );
};
