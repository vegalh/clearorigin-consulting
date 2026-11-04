import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, className = '', ...rest }: CardProps) {
  return (
    <div
      className={`rounded-co-lg border border-co-line bg-co-paper p-6 shadow-[0_1px_2px_rgba(28,37,33,0.04)] ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
