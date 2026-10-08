import React from 'react';
import { cn } from '../../utils/formatting.ts';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      icon,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none';

    const variantStyles = {
      primary:
        'bg-[#12345B] hover:bg-[#0D2948] active:bg-[#091F37] text-white shadow-sm focus-visible:ring-[#12345B] border border-transparent',
      secondary:
        'bg-white hover:bg-[#F8FAFC] active:bg-[#F5F7FA] text-[#12345B] border border-[#D7DEE7] hover:border-[#BBC6D3] focus-visible:ring-[#12345B] shadow-sm',
      tertiary:
        'bg-transparent hover:bg-[#EAF1F8] active:bg-[#D7DEE7] text-[#12345B] focus-visible:ring-[#12345B]',
      destructive:
        'bg-[#B42318] hover:bg-[#911c13] text-white shadow-sm focus-visible:ring-[#B42318] border border-transparent',
    };

    const sizeStyles = {
      sm: 'h-8 px-3 text-xs rounded-[4px] gap-1.5',
      md: 'h-10 px-4 text-sm rounded-[6px] gap-2',
      lg: 'h-11 px-5 text-base rounded-[6px] gap-2.5',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-0.5 h-4 w-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>{loadingText || children}</span>
          </>
        ) : (
          <>
            {icon && <span className="inline-flex shrink-0">{icon}</span>}
            <span>{children}</span>
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
