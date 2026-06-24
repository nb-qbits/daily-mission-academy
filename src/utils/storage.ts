import type {
  ChildId,
  ChildProgress,
  ParentReview,
  ProgressStore,
  QuizResult,
  SectionCompletion,
} from '../types';

const KEYS = {
  activeKid: 'dailyMission.activeKid',
  progress: (childId: ChildId) => `dailyMission.progress.${childId}`,
} as const;

function emptyChildProgress(childId: ChildId): ChildProgress {
  return { childId, assignments: {} };
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// ---------- active kid ----------

export function getActiveKid(): ChildId | null {
  const raw = localStorage.getItem(KEYS.activeKid);
  if (raw === 'iraj' || raw === 'aveer') return raw;
  return null;
}

export function setActiveKid(childId: ChildId | null): void {
  if (childId) {
    localStorage.setItem(KEYS.activeKid, childId);
  } else {
    localStorage.removeItem(KEYS.activeKid);
  }
}

// ---------- progress ----------

export function getChildProgress(childId: ChildId): ChildProgress {
  const raw = localStorage.getItem(KEYS.progress(childId));
  return safeParse<ChildProgress>(raw, emptyChildProgress(childId));
}

export function getFullProgressStore(): ProgressStore {
  return {
    iraj: getChildProgress('iraj'),
    aveer: getChildProgress('aveer'),
  };
}

export function saveChildProgress(progress: ChildProgress): void {
  localStorage.setItem(KEYS.progress(progress.childId), JSON.stringify(progress));
}

function ensureAssignmentEntry(progress: ChildProgress, assignmentId: string) {
  if (!progress.assignments[assignmentId]) {
    progress.assignments[assignmentId] = {
      assignmentId,
      sectionsCompleted: {},
    };
  }
  return progress.assignments[assignmentId];
}

export function setSectionComplete(
  childId: ChildId,
  assignmentId: string,
  sectionId: string,
  complete: boolean
): ChildProgress {
  const progress = getChildProgress(childId);
  const entry = ensureAssignmentEntry(progress, assignmentId);
  const sectionsCompleted: SectionCompletion = { ...entry.sectionsCompleted, [sectionId]: complete };
  progress.assignments[assignmentId] = { ...entry, sectionsCompleted };
  saveChildProgress(progress);
  return progress;
}

export function saveQuizResult(childId: ChildId, result: QuizResult): ChildProgress {
  const progress = getChildProgress(childId);
  const entry = ensureAssignmentEntry(progress, result.assignmentId);
  progress.assignments[result.assignmentId] = { ...entry, quizResult: result };
  saveChildProgress(progress);
  return progress;
}

export function saveParentReview(childId: ChildId, review: ParentReview): ChildProgress {
  const progress = getChildProgress(childId);
  const entry = ensureAssignmentEntry(progress, review.assignmentId);
  progress.assignments[review.assignmentId] = {
    ...entry,
    parentReview: review,
    completedAt: new Date().toISOString(),
  };
  saveChildProgress(progress);
  return progress;
}

export function clearChildProgress(childId: ChildId): ChildProgress {
  const fresh = emptyChildProgress(childId);
  saveChildProgress(fresh);
  return fresh;
}
