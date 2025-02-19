import React from 'react';
import { formClasses } from '@/lib/utils/forms';
import { LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: LucideIcon;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon: Icon, className, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <label className={formClasses.label}>
          {label}
        </label>
        <div className="relative">
          {Icon && (
            <Icon className={formClasses.iconWrapper} />
          )}
          <input
            ref={ref}
            className={`${formClasses.input} ${Icon ? 'pl-10' : ''} ${className}`}
            {...props}
          />
        </div>
        {error && (
          <p className={formClasses.error}>{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';