import type { Assignment, AssignmentProgress } from '../types';

interface AssignmentViewProps {
  assignment: Assignment;
  progress: AssignmentProgress | undefined;
  onToggleSection: (sectionId: string, complete: boolean) => void;
  onBack: () => void;
  onTakeQuiz: () => void;
}

function SectionToggle({
  sectionId,
  done,
  onToggleSection,
}: {
  sectionId: string;
  done: boolean;
  onToggleSection: (sectionId: string, complete: boolean) => void;
}) {
  return (
    <button
      className={`section-mark-btn ${done ? 'section-mark-btn--done' : ''}`}
      onClick={() => onToggleSection(sectionId, !done)}
    >
      {done ? '✓ Complete' : 'Mark Complete'}
    </button>
  );
}

export default function AssignmentView({
  assignment,
  progress,
  onToggleSection,
  onBack,
  onTakeQuiz,
}: AssignmentViewProps) {
  const sectionsCompleted = progress?.sectionsCompleted ?? {};
  const hasSection = (id: string) => assignment.sections.some((s) => s.id === id);
  const sectionLabel = (id: string, fallback: string) =>
    assignment.sections.find((s) => s.id === id)?.label ?? fallback;

  return (
    <div>
      <button className="back-link" onClick={onBack}>
        ← Back to Today
      </button>

      <div className="view-title-row">
        <div>
          <div className="mission-patch__meta-day">Day {assignment.dayNumber}</div>
          <h2>{assignment.title}</h2>
        </div>
      </div>

      {hasSection('lesson') && (
        <div className="card assignment-section">
          <div className="assignment-section__head">
            <h3>📘 {sectionLabel('lesson', 'Lesson')}</h3>
            <SectionToggle
              sectionId="lesson"
              done={Boolean(sectionsCompleted.lesson)}
              onToggleSection={onToggleSection}
            />
          </div>
          {assignment.lesson.map((block, i) => (
            <div className="lesson-block" key={i}>
              <h4>{block.heading}</h4>
              <p>{block.body}</p>
            </div>
          ))}
        </div>
      )}

      {hasSection('exercises') && (
        <div className="card assignment-section">
          <div className="assignment-section__head">
            <h3>✏️ {sectionLabel('exercises', 'Exercises')}</h3>
            <SectionToggle
              sectionId="exercises"
              done={Boolean(sectionsCompleted.exercises)}
              onToggleSection={onToggleSection}
            />
          </div>
          <ul className="exercise-list">
            {assignment.exercises.map((ex, i) => (
              <li key={ex.id}>
                <span className="exercise-list__index">{i + 1}.</span>
                <span>{ex.prompt}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasSection('writing') && (
        <div className="card assignment-section">
          <div className="assignment-section__head">
            <h3>🖋️ {sectionLabel('writing', 'Writing Mission')}</h3>
            <SectionToggle
              sectionId="writing"
              done={Boolean(sectionsCompleted.writing)}
              onToggleSection={onToggleSection}
            />
          </div>
          <div className="prompt-box">
            {assignment.writingPrompt.prompt}
            {assignment.writingPrompt.minWords && (
              <div className="score-hint">
                Aim for at least {assignment.writingPrompt.minWords} words.
              </div>
            )}
          </div>
        </div>
      )}

      {hasSection('enrichment') && assignment.scienceOrSocialStudies && (
        <div className="card assignment-section">
          <div className="assignment-section__head">
            <h3>🔬 {sectionLabel('enrichment', 'Science / Social Studies')}</h3>
            <SectionToggle
              sectionId="enrichment"
              done={Boolean(sectionsCompleted.enrichment)}
              onToggleSection={onToggleSection}
            />
          </div>
          <div className="lesson-block">
            <h4>{assignment.scienceOrSocialStudies.heading}</h4>
            <p>{assignment.scienceOrSocialStudies.body}</p>
          </div>
          {assignment.scienceOrSocialStudies.activity && (
            <div className="prompt-box">
              <strong>Try it: </strong>
              {assignment.scienceOrSocialStudies.activity}
            </div>
          )}
        </div>
      )}

      {hasSection('vocabulary') && (
        <div className="card assignment-section">
          <div className="assignment-section__head">
            <h3>🔑 {sectionLabel('vocabulary', 'Vocabulary')}</h3>
            <SectionToggle
              sectionId="vocabulary"
              done={Boolean(sectionsCompleted.vocabulary)}
              onToggleSection={onToggleSection}
            />
          </div>
          <div className="vocab-grid">
            {assignment.vocabulary.map((v) => (
              <div className="vocab-card" key={v.word}>
                <div className="vocab-card__word">{v.word}</div>
                <div className="vocab-card__def">{v.definition}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {assignment.parentChecklist.length > 0 && (
        <div className="card assignment-section">
          <h3>👨‍👩‍👧 Parent Checklist</h3>
          <p className="text-soft" style={{ marginTop: 8, marginBottom: 14 }}>
            A quick reference for what to check before moving on.
          </p>
          <ul className="checklist-static">
            {assignment.parentChecklist.map((item) => (
              <li key={item.id}>{item.label}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="spacer-top">
        <button className="btn btn-primary btn-block" onClick={onTakeQuiz}>
          📝 Ready — Take the Quiz
        </button>
      </div>
    </div>
  );
}
