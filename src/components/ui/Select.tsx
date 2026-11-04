import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { fieldBase } from './fieldStyles';

type Variant = 'pill' | 'field';
type Size = 'md' | 'sm';

const variantClasses: Record<Variant, Record<Size, string>> = {
  pill: {
    md: 'rounded-full py-2.5 pl-4 pr-10 text-sm',
    sm: 'rounded-full py-2 pl-3 pr-8 text-xs',
  },
  field: {
    md: 'rounded-co-sm py-2 pl-3 pr-10 text-sm',
    sm: 'rounded-co-sm py-1.5 pl-3 pr-8 text-xs',
  },
};

const iconClasses: Record<Size, string> = {
  md: 'right-3.5 h-4 w-4',
  sm: 'right-3 h-3.5 w-3.5',
};

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /** `pill` for toolbar/filter controls, `field` to sit alongside form inputs. */
  variant?: Variant;
  size?: Size;
  /** Classes for the positioning wrapper (width, flex behavior, margins). */
  wrapperClassName?: string;
}

/**
 * Native `<select>` restyled to match the warm design system. Staying native
 * keeps keyboard, screen-reader and mobile picker behavior intact; the opened
 * option list is themed too where `appearance: base-select` is supported
 * (see `.co-select` in index.css).
 */
export function Select({ variant = 'pill', size = 'md', className = '', wrapperClassName = '', children, ...rest }: SelectProps) {
  return (
    <div className={`relative inline-flex min-w-0 ${wrapperClassName}`}>
      <select
        className={`co-select ${fieldBase} w-full min-w-0 cursor-pointer appearance-none truncate font-medium ${variantClasses[variant][size]} ${className}`}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-co-muted ${iconClasses[size]}`}
      />
    </div>
  );
}
