import React from 'react';
import { cn } from '../../utils/formatting.ts';

export interface EmptyStateProps {
  message: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ message, action, className }) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center bg-white border border-[#D7DEE7] rounded-[8px] min-h-[180px]',
        className
      )}
    >
      <p className="text-sm text-[#5E6B7A] font-normal mb-4">{message}</p>
      {action && <div>{action}</div>}
    </div>
  );
};
