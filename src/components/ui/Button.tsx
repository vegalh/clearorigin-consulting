import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';
type Size = 'md' | 'sm';

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-tight transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed';

const variantClasses: Record<Variant, string> = {
  primary: 'bg-co-green text-white hover:bg-co-ink',
  secondary: 'bg-co-pale text-co-green hover:bg-co-line',
  outline: 'border border-co-line text-co-ink hover:border-co-green hover:text-co-green bg-transparent',
  ghost: 'text-co-ink hover:bg-co-pale',
};

const sizeClasses: Record<Size, string> = {
  md: 'px-6 py-3 text-sm',
  sm: 'px-4 py-2 text-xs',
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
}

type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ variant = 'primary', size = 'md', className = '', children, ...rest }: ButtonProps) {
  return (
    <button className={`${base} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

type ButtonLinkProps = CommonProps & LinkProps;

/** Same visual treatment as `Button`, but renders a router `Link` for navigation CTAs. */
export function ButtonLink({ variant = 'primary', size = 'md', className = '', children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={`${base} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`} {...rest}>
      {children}
    </Link>
  );
}
