import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, className = '', ...rest }: CardProps) {
  return (
    <div
      className={`rounded-co-lg border border-co-line bg-co-paper p-6 shadow-[0_2px_10px_rgba(68,51,43,0.06)] ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
