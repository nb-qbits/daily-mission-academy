import type { Kid } from '../types';

interface HeaderProps {
  activeKid: Kid | null;
  onSwitchKid: () => void;
}

export default function Header({ activeKid, onSwitchKid }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <div className="app-header__brand">
          <h1>Daily Mission Academy</h1>
        </div>
        {activeKid && (
          <div className="app-header__kid">
            <div className="app-header__kid-badge">
              <span className="app-header__kid-icon">{activeKid.icon}</span>
              <span className="app-header__kid-name">{activeKid.name}</span>
            </div>
            <button className="app-header__switch" onClick={onSwitchKid}>
              Switch Kid
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
