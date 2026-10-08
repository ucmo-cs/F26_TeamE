import React from 'react';
import { useLanguage } from '../../i18n/useLanguage.ts';
import { cn } from '../../utils/formatting.ts';

export interface FormFieldProps {
  id?: string;
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  required = false,
  error,
  hint,
  className,
  children,
}) => {
  const { t } = useLanguage();
  return (
    <div className={cn('flex flex-col space-y-1.5', className)}>
      {label && (
        <label
          htmlFor={id}
          className="text-[13px] font-semibold leading-[18px] text-[#172033] select-none"
        >
          {label}
          {required && <span className="ml-1 text-[#B42318]">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p
          id={id ? `${id}-error` : undefined}
          className="text-[12px] leading-[16px] text-[#B42318] mt-1 font-normal"
        >
          {t(error)}
        </p>
      )}
      {!error && hint && (
        <p className="text-[12px] leading-[16px] text-[#7B8794] mt-1">
          {hint}
        </p>
      )}
    </div>
  );
};
