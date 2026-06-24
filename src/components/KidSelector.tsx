import { KID_LIST } from '../kids';
import type { ChildId } from '../types';

interface KidSelectorProps {
  onSelect: (childId: ChildId) => void;
}

export default function KidSelector({ onSelect }: KidSelectorProps) {
  return (
    <div className="selector">
      <div className="selector__eyebrow">Daily Mission Academy</div>
      <h2 className="selector__title">Who is studying today?</h2>
      <p className="selector__subtitle">Choose your mission path</p>

      <div className="selector__grid">
        {KID_LIST.map((kid) => (
          <button
            key={kid.id}
            className={`kid-card kid-card--${kid.id}`}
            onClick={() => onSelect(kid.id)}
          >
            <div className="kid-card__top">
              <span className="kid-card__icon">{kid.icon}</span>
              <div>
                <div className="kid-card__name">{kid.name}</div>
                <div className="kid-card__grade">{kid.gradeLabel}</div>
              </div>
            </div>

            <span className="kid-card__path">{kid.pathLabel}</span>
            <div className="kid-card__theme">{kid.themeLabel}</div>

            <div>
              <div className="kid-card__focus-label">Focus areas</div>
              <ul className="kid-card__focus-list">
                {kid.focusAreas.map((area) => (
                  <li key={area}>{area}</li>
                ))}
              </ul>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
