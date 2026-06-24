import type { Assignment, ChildProgress, Kid } from '../types';
import {
  calculateAverageScore,
  calculateStreak,
  countCompletedAssignments,
  getAggregateWeakAreas,
  getLast7Scores,
} from '../utils/scoring';

interface ProgressViewProps {
  kid: Kid;
  progress: ChildProgress;
  assignments: Assignment[];
  onBack: () => void;
}

export default function ProgressView({ kid, progress, assignments, onBack }: ProgressViewProps) {
  const completedCount = countCompletedAssignments(progress);
  const averageScore = calculateAverageScore(kid.id, progress);
  const streak = calculateStreak(progress, assignments);
  const history = getLast7Scores(kid.id, progress, assignments);
  const weakAreas = getAggregateWeakAreas(kid.id, progress);

  return (
    <div>
      <button className="back-link" onClick={onBack}>
        ← Back to Today
      </button>
      <h2 style={{ marginBottom: 4 }}>{kid.name}'s Progress</h2>
      <p className="text-soft" style={{ marginBottom: 18 }}>{kid.pathLabel} · {kid.gradeLabel}</p>

      <div className="progress-grid">
        <div className="stat-card">
          <div className="stat-card__value">{completedCount}</div>
          <div className="stat-card__label">Assignments Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{averageScore !== null ? `${averageScore}%` : '—'}</div>
          <div className="stat-card__label">Average Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{streak} 🔥</div>
          <div className="stat-card__label">Current Streak</div>
        </div>
      </div>

      <div className="card spacer-top">
        <div className="section-title">Last 7 Scores</div>
        {history.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">📈</div>
            No completed reviews yet. Scores will appear here after the first Parent Review is saved.
          </div>
        ) : (
          <div className="score-history">
            {history.map((point) => (
              <div className="score-history__bar-wrap" key={point.assignmentId}>
                <span className="score-history__value">{point.percentage}%</span>
                <div className="score-history__bar" style={{ height: `${Math.max(6, point.percentage)}%` }} />
                <span className="score-history__day">Day {point.dayNumber}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card spacer-top">
        <div className="section-title">Weak Areas</div>
        {weakAreas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">✅</div>
            No weak areas flagged right now — nice work!
          </div>
        ) : (
          <ul className="weak-area-list">
            {weakAreas.map((area) => (
              <li className="weak-area-item" key={area.label}>
                <span className="weak-area-item__label">{area.label}</span>
                <span>{area.reason}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
