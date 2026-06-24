import { useState } from 'react';
import type { Assignment, AveerScores, ChildId, IrajScores, ParentReview, ParentScores } from '../types';

interface ParentReviewViewProps {
  childId: ChildId;
  assignment: Assignment;
  existingReview: ParentReview | undefined;
  onSave: (review: ParentReview) => void;
  onBack: () => void;
}

interface ScoreField {
  key: string;
  label: string;
  max: number;
}

const IRAJ_FIELDS: ScoreField[] = [
  { key: 'math', label: 'Math Score', max: 10 },
  { key: 'writing', label: 'Writing Score', max: 10 },
  { key: 'vocabulary', label: 'Vocabulary Score', max: 5 },
  { key: 'focus', label: 'Focus / Effort Score', max: 5 },
];

const AVEER_FIELDS: ScoreField[] = [
  { key: 'reading', label: 'Reading Score', max: 10 },
  { key: 'math', label: 'Math Score', max: 10 },
  { key: 'writing', label: 'Writing Score', max: 5 },
  { key: 'focus', label: 'Focus / Effort Score', max: 5 },
];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultScores(fields: ScoreField[], existing: ParentScores | undefined): Record<string, number> {
  const result: Record<string, number> = {};
  fields.forEach((f) => {
    const existingValue = existing ? (existing as unknown as Record<string, number>)[f.key] : undefined;
    result[f.key] = typeof existingValue === 'number' ? existingValue : 0;
  });
  return result;
}

export default function ParentReviewView({
  childId,
  assignment,
  existingReview,
  onSave,
  onBack,
}: ParentReviewViewProps) {
  const fields = childId === 'iraj' ? IRAJ_FIELDS : AVEER_FIELDS;

  const [scores, setScores] = useState<Record<string, number>>(
    defaultScores(fields, existingReview?.scores)
  );
  const [parentNotes, setParentNotes] = useState(existingReview?.parentNotes ?? '');
  const [mistakes, setMistakes] = useState<string[]>(
    existingReview?.mistakes && existingReview.mistakes.length > 0 ? existingReview.mistakes : ['']
  );
  const [writingSample, setWritingSample] = useState(existingReview?.writingSample ?? '');
  const [date, setDate] = useState(existingReview?.date ?? todayISO());

  function setScore(key: string, max: number, value: string) {
    const num = Math.max(0, Math.min(max, Number(value) || 0));
    setScores((prev) => ({ ...prev, [key]: num }));
  }

  function updateMistake(index: number, value: string) {
    setMistakes((prev) => prev.map((m, i) => (i === index ? value : m)));
  }

  function addMistakeRow() {
    setMistakes((prev) => [...prev, '']);
  }

  function removeMistakeRow(index: number) {
    setMistakes((prev) => (prev.length === 1 ? [''] : prev.filter((_, i) => i !== index)));
  }

  function handleSave() {
    const cleanedMistakes = mistakes.map((m) => m.trim()).filter((m) => m.length > 0);

    const review: ParentReview = {
      childId,
      assignmentId: assignment.id,
      date,
      scores: scores as unknown as ParentScores,
      parentNotes,
      mistakes: cleanedMistakes,
      writingSample,
    };
    onSave(review);
  }

  return (
    <div>
      <button className="back-link" onClick={onBack}>
        ← Back to Today
      </button>
      <h2 style={{ marginBottom: 18 }}>Parent Review: {assignment.title}</h2>

      <div className="card">
        <div className="section-title">Date</div>
        <div className="field" style={{ marginBottom: 18 }}>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div className="section-title">Scores</div>
        <div className="form-grid">
          {fields.map((f) => (
            <div className="field field--score" key={f.key}>
              <label htmlFor={`score-${f.key}`}>
                {f.label} (out of {f.max})
              </label>
              <input
                id={`score-${f.key}`}
                type="number"
                min={0}
                max={f.max}
                value={scores[f.key]}
                onChange={(e) => setScore(f.key, f.max, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="section-title">Mistakes Observed</div>
        {mistakes.map((mistake, i) => (
          <div className="mistake-row" key={i}>
            <input
              type="text"
              placeholder="e.g. Confused median and mode"
              value={mistake}
              onChange={(e) => updateMistake(i, e.target.value)}
            />
            <button className="icon-btn" onClick={() => removeMistakeRow(i)} aria-label="Remove">
              ✕
            </button>
          </div>
        ))}
        <button className="add-row-btn" onClick={addMistakeRow}>
          + Add another mistake
        </button>
      </div>

      <div className="card">
        <div className="field" style={{ marginBottom: 18 }}>
          <label htmlFor="writing-sample">Writing Sample</label>
          <textarea
            id="writing-sample"
            rows={4}
            placeholder="Paste or type what your child wrote..."
            value={writingSample}
            onChange={(e) => setWritingSample(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="parent-notes">Parent Notes (what was hard)</label>
          <textarea
            id="parent-notes"
            rows={4}
            placeholder="What did your child struggle with today?"
            value={parentNotes}
            onChange={(e) => setParentNotes(e.target.value)}
          />
        </div>
      </div>

      <button className="btn btn-primary btn-block" onClick={handleSave}>
        💾 Save Review &amp; Continue
      </button>
    </div>
  );
}
