import type { Assignment, AssignmentProgress, Kid } from '../types';

interface TodayViewProps {
  kid: Kid;
  assignment: Assignment;
  progress: AssignmentProgress | undefined;
  onToggleSection: (sectionId: string, complete: boolean) => void;
  onViewAssignment: () => void;
  onTakeQuiz: () => void;
  onParentReview: () => void;
  onViewProgress: () => void;
  onSwitchKid: () => void;
}

function MissionPatch({
  dayNumber,
  totalDays,
  completed,
  total,
  title,
  estimatedMinutes,
}: {
  dayNumber: number;
  totalDays: number;
  completed: number;
  total: number;
  title: string;
  estimatedMinutes: number;
}) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const pct = total === 0 ? 0 : completed / total;
  const dash = `${circumference * pct} ${circumference}`;

  return (
    <div className="mission-patch">
      <div className="mission-patch__ring-wrap">
        <svg viewBox="0 0 84 84">
          <circle className="mission-patch__ring-bg" cx="42" cy="42" r={radius} />
          <circle
            className="mission-patch__ring-fill"
            cx="42"
            cy="42"
            r={radius}
            strokeDasharray={dash}
          />
        </svg>
        <div className="mission-patch__ring-label">
          <span className="mission-patch__ring-count">
            {completed}/{total}
          </span>
          <span className="mission-patch__ring-total">sections</span>
        </div>
      </div>
      <div>
        <div className="mission-patch__meta-day">
          Day {dayNumber} of {totalDays}
        </div>
        <div className="mission-patch__meta-title">{title}</div>
        <div className="mission-patch__meta-sub">⏱ About {estimatedMinutes} minutes today</div>
      </div>
    </div>
  );
}

export default function TodayView({
  kid,
  assignment,
  progress,
  onToggleSection,
  onViewAssignment,
  onTakeQuiz,
  onParentReview,
  onViewProgress,
  onSwitchKid,
}: TodayViewProps) {
  const sectionsCompleted = progress?.sectionsCompleted ?? {};
  const completedCount = assignment.sections.filter((s) => sectionsCompleted[s.id]).length;
  const quizDone = Boolean(progress?.quizResult);
  const reviewDone = Boolean(progress?.parentReview);

  return (
    <div>
      <div className="today__greeting">Today's Mission</div>

      <div className="card">
        <MissionPatch
          dayNumber={assignment.dayNumber}
          totalDays={5}
          completed={completedCount}
          total={assignment.sections.length}
          title={assignment.title}
          estimatedMinutes={assignment.estimatedMinutes}
        />

        <div className="today__stats">
          <div className="today__stat">
            <span className="today__stat-value">{assignment.dayNumber}</span>
            <span className="today__stat-label">Day Number</span>
          </div>
          <div className="today__stat">
            <span className="today__stat-value">{assignment.estimatedMinutes}m</span>
            <span className="today__stat-label">Estimated Time</span>
          </div>
          <div className="today__stat">
            <span className="today__stat-value">
              {completedCount}/{assignment.sections.length}
            </span>
            <span className="today__stat-label">Sections Done</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Subject Sections — Tap to Mark Complete</div>
        <ul className="checklist">
          {assignment.sections.map((section) => {
            const done = Boolean(sectionsCompleted[section.id]);
            return (
              <li key={section.id}>
                <button
                  className={`checklist-item ${done ? 'checklist-item--done' : ''}`}
                  style={{ width: '100%', textAlign: 'left' }}
                  onClick={() => onToggleSection(section.id, !done)}
                >
                  <span className="checklist-item__box">{done ? '✓' : ''}</span>
                  <span className="checklist-item__label">{section.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="today__footer-actions">
          <span className={`pill ${quizDone ? 'pill--complete' : 'pill--pending'}`}>
            {quizDone ? 'Quiz complete' : 'Quiz pending'}
          </span>
          <span className={`pill ${reviewDone ? 'pill--complete' : 'pill--pending'}`}>
            {reviewDone ? 'Review saved' : 'Review pending'}
          </span>
        </div>
      </div>

      <div className="today__actions">
        <button className="btn btn-primary btn-block" onClick={onViewAssignment}>
          📘 View Assignment
        </button>
        <button className="btn btn-primary btn-block" onClick={onTakeQuiz}>
          📝 Take Quiz
        </button>
        <button className="btn btn-secondary btn-block" onClick={onParentReview}>
          👨‍👩‍👧 Parent Review
        </button>
        <button className="btn btn-secondary btn-block" onClick={onViewProgress}>
          📊 Progress
        </button>
      </div>

      <div className="spacer-top" style={{ textAlign: 'center' }}>
        <button className="btn-ghost btn" onClick={onSwitchKid}>
          Switch Kid ({kid.name} → someone else)
        </button>
      </div>
    </div>
  );
}
