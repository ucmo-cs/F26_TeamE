import React from 'react';
import { cn } from '../../utils/formatting.ts';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, hasError = false, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          className={cn(
            'flex h-10 w-full appearance-none rounded-[6px] bg-white border border-[#BBC6D3] pl-3 pr-8 py-2.5 text-sm text-[#172033]',
            'focus:outline-none focus:border-[#12345B] focus:ring-1 focus:ring-[#12345B]',
            hasError && 'border-[#B42318] focus:border-[#B42318] focus:ring-[#B42318]',
            props.disabled && 'bg-[#F5F7FA] opacity-60 cursor-not-allowed',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#5E6B7A]">
          <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';
