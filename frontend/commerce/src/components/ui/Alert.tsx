import React from 'react';
import { useLanguage } from '../../i18n/useLanguage.ts';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/formatting.ts';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  icon?: boolean;
}

export const Alert: React.FC<AlertProps> = ({
  children,
  className,
  variant = 'info',
  title,
  icon = true,
  ...props
}) => {
  const { t } = useLanguage();
  const styles = {
    success: 'bg-[#E9F6F0] border-[#197A55]/40 text-[#197A55]',
    warning: 'bg-[#FFF5E5] border-[#A45B08]/40 text-[#A45B08]',
    error: 'bg-[#FDECEC] border-[#B42318]/40 text-[#B42318]',
    info: 'bg-[#EAF1F8] border-[#12345B]/30 text-[#12345B]',
  };

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 shrink-0 text-[#197A55]" />,
    warning: <AlertTriangle className="h-5 w-5 shrink-0 text-[#A45B08]" />,
    error: <AlertCircle className="h-5 w-5 shrink-0 text-[#B42318]" />,
    info: <Info className="h-5 w-5 shrink-0 text-[#12345B]" />,
  };

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 p-4 border rounded-[6px] text-sm leading-5',
        styles[variant],
        className
      )}
      {...props}
    >
      {icon && icons[variant]}
      <div className="flex-1">
        {title && <h5 className="font-semibold mb-0.5 text-inherit">{title}</h5>}
        <div className="text-inherit font-normal">{typeof children === 'string' ? t(children) : children}</div>
      </div>
    </div>
  );
};
