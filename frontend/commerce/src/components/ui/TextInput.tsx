import React from 'react';
import { cn } from '../../utils/formatting.ts';

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  prefixElement?: React.ReactNode;
  suffixElement?: React.ReactNode;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ className, hasError = false, prefixElement, suffixElement, type = 'text', ...props }, ref) => {
    if (prefixElement || suffixElement) {
      return (
        <div
          className={cn(
            'flex items-center h-10 w-full rounded-[6px] bg-white border border-[#BBC6D3] transition-colors',
            'focus-within:border-[#12345B] focus-within:ring-1 focus-within:ring-[#12345B]',
            hasError && 'border-[#B42318] focus-within:border-[#B42318] focus-within:ring-[#B42318]',
            props.disabled && 'bg-[#F5F7FA] opacity-60 cursor-not-allowed',
            className
          )}
        >
          {prefixElement && (
            <div className="pl-3 pr-2 text-sm font-medium text-[#5E6B7A] select-none flex items-center shrink-0">
              {prefixElement}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className="w-full h-full px-3 py-2.5 bg-transparent text-sm text-[#172033] placeholder-[#7B8794] focus:outline-none disabled:cursor-not-allowed"
            {...props}
          />
          {suffixElement && (
            <div className="pr-3 pl-2 text-sm font-medium text-[#5E6B7A] select-none flex items-center shrink-0">
              {suffixElement}
            </div>
          )}
        </div>
      );
    }

    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'flex h-10 w-full rounded-[6px] bg-white border border-[#BBC6D3] px-3 py-2.5 text-sm text-[#172033] placeholder-[#7B8794]',
          'focus:outline-none focus:border-[#12345B] focus:ring-1 focus:ring-[#12345B]',
          hasError && 'border-[#B42318] focus:border-[#B42318] focus:ring-[#B42318]',
          props.disabled && 'bg-[#F5F7FA] opacity-60 cursor-not-allowed',
          className
        )}
        {...props}
      />
    );
  }
);

TextInput.displayName = 'TextInput';
