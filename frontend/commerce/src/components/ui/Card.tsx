import React from 'react';
import { cn } from '../../utils/formatting.ts';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  subtle?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, subtle = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'border rounded-[8px] shadow-[0_1px_2px_rgba(16,24,40,0.04)]',
          subtle
            ? 'bg-[#F8FAFC] border-[#D7DEE7]'
            : 'bg-white border-[#D7DEE7]',
          'p-6',
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';
