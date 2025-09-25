import type { ReactNode } from 'react';
import './NavBar.css';

interface NavBarProps {
  title?: string;
  actions?: ReactNode;
}

export const NavBar = ({ title = 'PuzzleLocator', actions }: NavBarProps) => {
  return (
    <nav className="navbar">
      <div className="navbar-content">
        <h1 className="navbar-title">{title}</h1>
        {actions && <div className="navbar-actions">{actions}</div>}
      </div>
    </nav>
  );
};
