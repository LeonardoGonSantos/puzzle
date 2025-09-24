import type { ReactNode } from 'react';

interface StatusBannerProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  children: ReactNode;
  icon?: ReactNode;
}

export const StatusBanner = ({ variant = 'info', children, icon }: StatusBannerProps) => (
  <div className="status-banner" data-variant={variant} role="status" aria-live="polite">
    {icon ?? <span aria-hidden="true">•</span>}
    <span>{children}</span>
  </div>
);
