import React from 'react';
import { cn } from '../../utils/formatting.ts';

export interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  backAction?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  action,
  backAction,
  className,
}) => {
  return (
    <div className={cn('mb-6', className)}>
      {backAction && <div className="mb-3">{backAction}</div>}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[30px] leading-[36px] font-semibold text-[#172033] tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-[14px] leading-[20px] text-[#5E6B7A] mt-1 font-normal">
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0 pt-1">{action}</div>}
      </div>
    </div>
  );
};
