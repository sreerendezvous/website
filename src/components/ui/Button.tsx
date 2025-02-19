import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-none font-body font-light transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-earth-900 disabled:pointer-events-none disabled:opacity-50 uppercase tracking-wider',
          {
            'bg-sand-200 text-earth-900 hover:bg-sand-300': variant === 'primary',
            'bg-earth-800/80 text-sand-50 hover:bg-earth-700/80 backdrop-blur-sm': variant === 'secondary',
            'border border-sand-300 bg-transparent text-sand-300 hover:bg-earth-800/50': variant === 'outline',
            'h-8 px-3 text-xs': size === 'sm',
            'h-10 px-4 text-sm': size === 'md',
            'h-12 px-6 text-base': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);