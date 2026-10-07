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

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 pb-4 border-b border-[#D7DEE7]/50 mb-5', className)}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-base font-semibold leading-6 text-[#172033]', className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-[#5E6B7A] leading-5', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('', className)} {...props} />
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center pt-5 mt-5 border-t border-[#D7DEE7]', className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';
