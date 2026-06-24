// Core data model for Daily Mission Academy.
// Keep this file framework-agnostic: it describes shapes for JSON content
// files and localStorage records, not React-specific concerns.

export type ChildId = 'iraj' | 'aveer';

export interface Kid {
  id: ChildId;
  name: string;
  gradeLevel: number;
  gradeLabel: string; // e.g. "Rising 5th Grade"
  focusAreas: string[];
  themeLabel: string; // e.g. "Data Detective + Force Explorer"
  icon: string; // emoji used as a lightweight icon
  pathLabel: string; // "Mission Control" / "Adventure Path"
}

export interface AssignmentSection {
  id: string; // stable id used for completion tracking, e.g. "lesson", "exercises"
  label: string; // human-readable label shown on checklists
}

export type QuizQuestionType = 'multiple-choice' | 'true-false' | 'short-answer';

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  question: string;
  options?: string[]; // present for multiple-choice
  correctAnswer: string;
  explanation?: string;
}

export interface ParentChecklistItem {
  id: string;
  label: string;
}

export interface LessonBlock {
  heading: string;
  body: string;
}

export interface ExerciseItem {
  id: string;
  prompt: string;
}

export interface VocabularyWord {
  word: string;
  definition: string;
}

export interface Assignment {
  id: string; // e.g. "iraj-week1-day1"
  childId: ChildId;
  gradeLevel: number;
  weekId: string;
  dayNumber: number;
  title: string;
  theme?: string;
  estimatedMinutes: number;
  sections: AssignmentSection[];
  lesson: LessonBlock[];
  exercises: ExerciseItem[];
  writingPrompt: {
    prompt: string;
    minWords?: number;
  };
  scienceOrSocialStudies?: {
    heading: string;
    body: string;
    activity?: string;
  };
  vocabulary: VocabularyWord[];
  quizQuestions: QuizQuestion[];
  parentChecklist: ParentChecklistItem[];
}

export interface ManifestChildEntry {
  currentWeek: string;
  files: string[]; // filenames relative to public/content/<childId>/
}

export interface Manifest {
  version: string;
  children: Record<ChildId, ManifestChildEntry>;
}

// ---------- localStorage record shapes ----------

export interface QuizResult {
  childId: ChildId;
  assignmentId: string;
  answers: Record<string, string>;
  score: number;
  maxScore: number;
  submittedAt: string; // ISO timestamp
}

export interface IrajScores {
  math: number; // out of 10
  writing: number; // out of 10
  vocabulary: number; // out of 5
  focus: number; // out of 5
}

export interface AveerScores {
  reading: number; // out of 10
  math: number; // out of 10
  writing: number; // out of 5
  focus: number; // out of 5
}

export type ParentScores = IrajScores | AveerScores;

export interface ParentReview {
  childId: ChildId;
  assignmentId: string;
  date: string; // YYYY-MM-DD
  scores: ParentScores;
  parentNotes: string;
  mistakes: string[];
  writingSample: string;
}

export interface SectionCompletion {
  [sectionId: string]: boolean;
}

export interface AssignmentProgress {
  assignmentId: string;
  sectionsCompleted: SectionCompletion;
  quizResult?: QuizResult;
  parentReview?: ParentReview;
  completedAt?: string; // ISO timestamp, set once the parent review is saved
}

export interface ChildProgress {
  childId: ChildId;
  assignments: Record<string, AssignmentProgress>; // keyed by assignmentId
}

export interface ProgressStore {
  iraj: ChildProgress;
  aveer: ChildProgress;
}

export type WeakArea = {
  label: string;
  reason: string;
};

export type ViewName =
  | 'select'
  | 'today'
  | 'assignment'
  | 'quiz'
  | 'review'
  | 'progress'
  | 'export';
