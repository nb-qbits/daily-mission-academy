import { useState } from 'react';
import type { Assignment, ChildId, QuizResult } from '../types';

interface QuizViewProps {
  childId: ChildId;
  assignment: Assignment;
  existingResult: QuizResult | undefined;
  onSubmit: (result: QuizResult) => void;
  onBack: () => void;
  onContinueToReview: () => void;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function scoreQuiz(assignment: Assignment, answers: Record<string, string>) {
  let score = 0;
  assignment.quizQuestions.forEach((q) => {
    const given = answers[q.id] ?? '';
    if (normalize(given) === normalize(q.correctAnswer)) {
      score += 1;
    }
  });
  return score;
}

export default function QuizView({
  childId,
  assignment,
  existingResult,
  onSubmit,
  onBack,
  onContinueToReview,
}: QuizViewProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(existingResult?.answers ?? {});
  const [submitted, setSubmitted] = useState<boolean>(Boolean(existingResult));
  const [result, setResult] = useState<QuizResult | undefined>(existingResult);

  const maxScore = assignment.quizQuestions.length;

  function setAnswer(questionId: string, value: string) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function handleSubmit() {
    const score = scoreQuiz(assignment, answers);
    const newResult: QuizResult = {
      childId,
      assignmentId: assignment.id,
      answers,
      score,
      maxScore,
      submittedAt: new Date().toISOString(),
    };
    setResult(newResult);
    setSubmitted(true);
    onSubmit(newResult);
  }

  const allAnswered = assignment.quizQuestions.every((q) => (answers[q.id] ?? '').trim().length > 0);

  return (
    <div>
      <button className="back-link" onClick={onBack}>
        ← Back to Today
      </button>
      <h2 style={{ marginBottom: 18 }}>Quiz: {assignment.title}</h2>

      {submitted && result && (
        <div className={`quiz-result-banner ${result.score / result.maxScore >= 0.7 ? 'quiz-result-banner--good' : 'quiz-result-banner--okay'}`}>
          <div className="quiz-result-banner__score">
            {result.score} / {result.maxScore}
          </div>
          <div>
            {result.score / result.maxScore >= 0.7
              ? 'Great job! Mission accomplished.'
              : 'Good effort — review the answer key below together.'}
          </div>
        </div>
      )}

      <div className="card">
        {assignment.quizQuestions.map((q, i) => {
          const given = answers[q.id] ?? '';
          const isCorrect = submitted && normalize(given) === normalize(q.correctAnswer);

          return (
            <div className="quiz-question" key={q.id}>
              <div className="quiz-question__prompt">
                <span className="quiz-question__index">Q{i + 1}.</span>
                <span>{q.question}</span>
              </div>

              {q.type === 'multiple-choice' && (
                <div className="quiz-options">
                  {(q.options ?? []).map((opt) => (
                    <button
                      key={opt}
                      className={`quiz-option ${given === opt ? 'quiz-option--selected' : ''}`}
                      onClick={() => setAnswer(q.id, opt)}
                      disabled={submitted}
                    >
                      <span className="quiz-option__radio" />
                      <span>{opt}</span>
                    </button>
                  ))}
                </div>
              )}

              {q.type === 'true-false' && (
                <div className="quiz-options">
                  {['True', 'False'].map((opt) => (
                    <button
                      key={opt}
                      className={`quiz-option ${given === opt ? 'quiz-option--selected' : ''}`}
                      onClick={() => setAnswer(q.id, opt)}
                      disabled={submitted}
                    >
                      <span className="quiz-option__radio" />
                      <span>{opt}</span>
                    </button>
                  ))}
                </div>
              )}

              {q.type === 'short-answer' && (
                <input
                  className="quiz-input"
                  type="text"
                  value={given}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  disabled={submitted}
                  placeholder="Type your answer..."
                />
              )}

              {submitted && (
                <div
                  className={`answer-key-item ${isCorrect ? 'answer-key-item--correct' : 'answer-key-item--incorrect'}`}
                  style={{ marginTop: 10 }}
                >
                  <strong>{isCorrect ? '✓ Correct' : '✗ Not quite'}</strong>
                  <div className="answer-key-item__row">
                    <span>Your answer: {given || '(blank)'}</span>
                    <span>Correct answer: {q.correctAnswer}</span>
                  </div>
                  {q.explanation && <p style={{ marginTop: 8 }}>{q.explanation}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!submitted ? (
        <button className="btn btn-primary btn-block spacer-top" onClick={handleSubmit} disabled={!allAnswered}>
          Submit Quiz
        </button>
      ) : (
        <button className="btn btn-primary btn-block spacer-top" onClick={onContinueToReview}>
          Continue to Parent Review →
        </button>
      )}
    </div>
  );
}
