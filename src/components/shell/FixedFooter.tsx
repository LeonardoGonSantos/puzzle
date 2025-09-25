import type { ReactNode } from 'react';
import './FixedFooter.css';

interface FixedFooterProps {
  children: ReactNode;
  className?: string;
}

export const FixedFooter = ({ children, className = '' }: FixedFooterProps) => {
  return (
    <footer className={`fixed-footer ${className}`}>
      <div className="fixed-footer-content">{children}</div>
    </footer>
  );
};
