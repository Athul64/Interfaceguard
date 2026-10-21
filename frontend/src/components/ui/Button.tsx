import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'clay';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-heading font-semibold transition-all select-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none rounded-sm';

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-xs sm:text-sm px-3.5 py-2 gap-2',
    lg: 'text-sm sm:text-base px-5 py-2.5 gap-2.5',
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-forest text-cream hover:bg-forest-deep active:bg-forest-deep shadow-sharp border border-forest/40 focus:ring-2 focus:ring-forest/20',
    secondary:
      'bg-paper text-charcoal hover:bg-cream border border-line hover:border-charcoal/30 shadow-sm focus:ring-2 focus:ring-forest/20',
    quiet:
      'bg-transparent text-forest hover:text-forest-deep hover:bg-forest/10 border border-transparent',
    clay:
      'bg-clay text-cream hover:bg-[#b84a28] active:bg-[#a64020] shadow-sharp border border-clay/50 focus:ring-2 focus:ring-clay/20',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};
