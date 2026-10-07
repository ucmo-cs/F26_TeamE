import React from 'react';
import { cn } from '../../utils/formatting.ts';

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn('animate-pulse rounded-[4px] bg-[#E2E8F0]', className)}
      {...props}
    />
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 6 }) => {
  return (
    <div className="w-full divide-y divide-[#D7DEE7] border border-[#D7DEE7] rounded-[8px] bg-white overflow-hidden">
      <div className="h-11 bg-[#F8FAFC] px-4 flex items-center gap-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24 ml-auto" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-12" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-13 px-4 flex items-center gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20 ml-auto" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-8 w-14 rounded-[6px]" />
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC<{ lines?: number; hasHeader?: boolean }> = ({
  lines = 4,
  hasHeader = true,
}) => {
  return (
    <div className="border border-[#D7DEE7] rounded-[8px] bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)] space-y-4">
      {hasHeader && (
        <div className="space-y-2 pb-4 border-b border-[#D7DEE7]/50">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3.5 w-64" />
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" style={{ width: `${85 - (i % 3) * 15}%` }} />
        ))}
      </div>
    </div>
  );
};
