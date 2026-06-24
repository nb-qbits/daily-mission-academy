import type {
  Assignment,
  AveerScores,
  ChildId,
  ChildProgress,
  IrajScores,
  ParentScores,
  WeakArea,
} from '../types';

// Max possible total points per child (both happen to total 30, but kept
// explicit per child in case the rubric changes later).
export const MAX_SCORE: Record<ChildId, number> = {
  iraj: 30, // math 10 + writing 10 + vocabulary 5 + focus 5
  aveer: 30, // reading 10 + math 10 + writing 5 + focus 5
};

export function calculateTotal(childId: ChildId, scores: ParentScores): number {
  if (childId === 'iraj') {
    const s = scores as IrajScores;
    return s.math + s.writing + s.vocabulary + s.focus;
  }
  const s = scores as AveerScores;
  return s.reading + s.math + s.writing + s.focus;
}

export function calculatePercentage(childId: ChildId, scores: ParentScores): number {
  const total = calculateTotal(childId, scores);
  return Math.round((total / MAX_SCORE[childId]) * 100);
}

export function getWeakAreas(childId: ChildId, scores: ParentScores): WeakArea[] {
  const weak: WeakArea[] = [];

  if (childId === 'iraj') {
    const s = scores as IrajScores;
    if (s.math < 7) weak.push({ label: 'Math', reason: 'Math needs review (scored below 7/10).' });
    if (s.writing < 7) weak.push({ label: 'Writing', reason: 'Writing needs review (scored below 7/10).' });
    if (s.vocabulary < 4) weak.push({ label: 'Vocabulary', reason: 'Vocabulary needs review (scored below 4/5).' });
    if (s.focus < 3) weak.push({ label: 'Focus / Effort', reason: 'Shorten future assignments (focus scored below 3/5).' });
  } else {
    const s = scores as AveerScores;
    if (s.reading < 7) weak.push({ label: 'Reading', reason: 'Reading needs review (scored below 7/10).' });
    if (s.math < 7) weak.push({ label: 'Math', reason: 'Math needs review (scored below 7/10).' });
    if (s.writing < 4) weak.push({ label: 'Writing', reason: 'Writing needs review (scored below 4/5).' });
    if (s.focus < 3) weak.push({ label: 'Focus / Effort', reason: 'Shorten future assignments (focus scored below 3/5).' });
  }

  return weak;
}

/**
 * Aggregated weak areas across every saved review for a child, most
 * frequent first. Used by the Progress view.
 */
export function getAggregateWeakAreas(childId: ChildId, progress: ChildProgress): WeakArea[] {
  const counts = new Map<string, WeakArea>();
  Object.values(progress.assignments).forEach((entry) => {
    if (!entry.parentReview) return;
    const areas = getWeakAreas(childId, entry.parentReview.scores);
    areas.forEach((area) => counts.set(area.label, area));
  });
  return Array.from(counts.values());
}

export function calculateAverageScore(childId: ChildId, progress: ChildProgress): number | null {
  const reviewed = Object.values(progress.assignments).filter((a) => a.parentReview);
  if (reviewed.length === 0) return null;
  const totalPct = reviewed.reduce(
    (sum, a) => sum + calculatePercentage(childId, a.parentReview!.scores),
    0
  );
  return Math.round(totalPct / reviewed.length);
}

/**
 * Current streak: consecutive completed assignments counting from Day 1
 * onward. Breaks at the first day in the sequence with no parent review.
 */
export function calculateStreak(progress: ChildProgress, assignments: Assignment[]): number {
  const sorted = [...assignments].sort((a, b) => a.dayNumber - b.dayNumber);
  let streak = 0;
  for (const assignment of sorted) {
    const entry = progress.assignments[assignment.id];
    if (entry?.parentReview) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

export interface ScoreHistoryPoint {
  assignmentId: string;
  dayNumber: number;
  title: string;
  percentage: number;
}

export function getLast7Scores(
  childId: ChildId,
  progress: ChildProgress,
  assignments: Assignment[]
): ScoreHistoryPoint[] {
  const byId = new Map(assignments.map((a) => [a.id, a]));
  const points: ScoreHistoryPoint[] = Object.values(progress.assignments)
    .filter((entry) => entry.parentReview && byId.has(entry.assignmentId))
    .map((entry) => {
      const assignment = byId.get(entry.assignmentId)!;
      return {
        assignmentId: entry.assignmentId,
        dayNumber: assignment.dayNumber,
        title: assignment.title,
        percentage: calculatePercentage(childId, entry.parentReview!.scores),
      };
    })
    .sort((a, b) => a.dayNumber - b.dayNumber);

  return points.slice(-7);
}

export function countCompletedAssignments(progress: ChildProgress): number {
  return Object.values(progress.assignments).filter((a) => a.completedAt).length;
}

/**
 * Returns the first assignment (in day order) that doesn't yet have a
 * saved parent review. Falls back to the first assignment (Day 1) if the
 * list is empty or everything is already complete-checked, the caller can
 * decide how to treat "all done".
 */
export function getFirstIncompleteAssignment(
  assignments: Assignment[],
  progress: ChildProgress
): Assignment | undefined {
  const sorted = [...assignments].sort((a, b) => a.dayNumber - b.dayNumber);
  const firstIncomplete = sorted.find((a) => !progress.assignments[a.id]?.completedAt);
  return firstIncomplete ?? sorted[0];
}
