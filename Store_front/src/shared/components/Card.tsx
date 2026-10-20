import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  elevated?: boolean;
}

export function Card({ children, className = "", elevated = true }: CardProps) {
  return (
    <div
      className={`rounded-lg transition-shadow duration-150 ${
        elevated ? "shadow-sm hover:shadow-md" : "bg-surface"
      } bg-surface text-on-surface ${className}`}
    >
      {children}
    </div>
  );
}