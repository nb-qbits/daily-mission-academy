import { useEffect, useState } from 'react';
import Header from './components/Header';
import KidSelector from './components/KidSelector';
import TodayView from './components/TodayView';
import AssignmentView from './components/AssignmentView';
import QuizView from './components/QuizView';
import ParentReviewView from './components/ParentReviewView';
import ProgressView from './components/ProgressView';
import ResultExport from './components/ResultExport';
import { KIDS } from './kids';
import { loadChildAssignments, loadManifest } from './utils/contentLoader';
import {
  getActiveKid,
  getChildProgress,
  saveParentReview,
  saveQuizResult,
  setActiveKid as persistActiveKid,
  setSectionComplete,
} from './utils/storage';
import { getFirstIncompleteAssignment } from './utils/scoring';
import type { Assignment, ChildId, ChildProgress, Manifest, ParentReview, QuizResult, ViewName } from './types';

type LoadState = 'loading' | 'ready' | 'error';

export default function App() {
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [loadError, setLoadError] = useState<string>('');
  const [manifest, setManifest] = useState<Manifest | null>(null);

  const [activeKidId, setActiveKidId] = useState<ChildId | null>(null);
  const [assignmentsCache, setAssignmentsCache] = useState<Partial<Record<ChildId, Assignment[]>>>({});
  const [progressByKid, setProgressByKid] = useState<Partial<Record<ChildId, ChildProgress>>>({});

  // The assignment currently "in focus" for the active kid. This is set
  // explicitly (on kid selection, and when returning to Today after a
  // review is saved) rather than recomputed on every render, so the quiz,
  // review, and export screens all stay pointed at the same assignment the
  // parent is working through even after completedAt gets set.
  const [workingAssignmentId, setWorkingAssignmentId] = useState<string | null>(null);

  const [view, setView] = useState<ViewName>('select');
  const [lastSavedReview, setLastSavedReview] = useState<ParentReview | null>(null);

  // ---- initial load: manifest + restore last active kid ----
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const loadedManifest = await loadManifest();
        if (cancelled) return;
        setManifest(loadedManifest);

        const restoredKid = getActiveKid();
        if (restoredKid) {
          const assignments = await loadChildAssignments(loadedManifest, restoredKid);
          if (cancelled) return;
          const childProgress = getChildProgress(restoredKid);
          setAssignmentsCache((prev) => ({ ...prev, [restoredKid]: assignments }));
          setProgressByKid((prev) => ({ ...prev, [restoredKid]: childProgress }));
          setActiveKidId(restoredKid);
          const working = getFirstIncompleteAssignment(assignments, childProgress);
          setWorkingAssignmentId(working?.id ?? null);
          setView('today');
        }
        setLoadState('ready');
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : 'Something went wrong loading content.');
        setLoadState('error');
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeKid = activeKidId ? KIDS[activeKidId] : null;
  const assignments = activeKidId ? assignmentsCache[activeKidId] ?? [] : [];
  const progress = activeKidId ? progressByKid[activeKidId] : undefined;
  const currentAssignment: Assignment | undefined = assignments.find((a) => a.id === workingAssignmentId);

  const allCaughtUp =
    Boolean(progress) &&
    assignments.length > 0 &&
    assignments.every((a) => Boolean(progress!.assignments[a.id]?.completedAt));

  function refocusWorkingAssignment(allAssignments: Assignment[], childProgress: ChildProgress) {
    const working = getFirstIncompleteAssignment(allAssignments, childProgress);
    setWorkingAssignmentId(working?.id ?? null);
  }

  async function handleSelectKid(childId: ChildId) {
    if (!manifest) return;
    persistActiveKid(childId);
    setActiveKidId(childId);
    setView('today');

    let childAssignments = assignmentsCache[childId];
    if (!childAssignments) {
      try {
        childAssignments = await loadChildAssignments(manifest, childId);
        setAssignmentsCache((prev) => ({ ...prev, [childId]: childAssignments! }));
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Could not load assignments for this child.');
        setLoadState('error');
        return;
      }
    }

    const childProgress = getChildProgress(childId);
    setProgressByKid((prev) => ({ ...prev, [childId]: childProgress }));
    refocusWorkingAssignment(childAssignments, childProgress);
  }

  function handleSwitchKid() {
    persistActiveKid(null);
    setActiveKidId(null);
    setWorkingAssignmentId(null);
    setView('select');
  }

  function handleToggleSection(sectionId: string, complete: boolean) {
    if (!activeKidId || !currentAssignment) return;
    const updated = setSectionComplete(activeKidId, currentAssignment.id, sectionId, complete);
    setProgressByKid((prev) => ({ ...prev, [activeKidId]: updated }));
  }

  function handleQuizSubmit(result: QuizResult) {
    if (!activeKidId) return;
    const updated = saveQuizResult(activeKidId, result);
    setProgressByKid((prev) => ({ ...prev, [activeKidId]: updated }));
  }

  function handleSaveReview(review: ParentReview) {
    if (!activeKidId) return;
    const updated = saveParentReview(activeKidId, review);
    setProgressByKid((prev) => ({ ...prev, [activeKidId]: updated }));
    setLastSavedReview(review);
    setView('export');
  }

  function handleBackToTodayFromExport() {
    if (activeKidId && progress) {
      // Recompute which assignment is now "current" — the one just
      // reviewed has completedAt set, so this naturally advances to the
      // next incomplete day (or loops back if the week is finished).
      refocusWorkingAssignment(assignments, progress);
    }
    setView('today');
  }

  // ---- top-level loading / error states ----
  if (loadState === 'loading') {
    return (
      <div className="app-shell">
        <Header activeKid={null} onSwitchKid={() => {}} />
        <main className="app-main">
          <div className="empty-state">
            <div className="empty-state__icon">🛰️</div>
            Loading mission content...
          </div>
        </main>
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <div className="app-shell">
        <Header activeKid={null} onSwitchKid={() => {}} />
        <main className="app-main">
          <div className="card">
            <h2>Couldn't load content</h2>
            <p className="text-soft">{loadError}</p>
            <p className="text-soft">
              Check that <code>public/content/manifest.json</code> exists and is valid JSON, then
              refresh the page.
            </p>
            <button className="btn btn-primary spacer-top" onClick={() => window.location.reload()}>
              Reload
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell" data-kid={activeKidId ?? undefined}>
      <Header activeKid={activeKid} onSwitchKid={handleSwitchKid} />
      <main className="app-main">
        {view === 'select' && <KidSelector onSelect={handleSelectKid} />}

        {view !== 'select' && activeKid && !currentAssignment && (
          <div className="empty-state">
            <div className="empty-state__icon">📦</div>
            No assignments found for {activeKid.name} yet. Add a content file and update{' '}
            <code>manifest.json</code>.
          </div>
        )}

        {view === 'today' && activeKid && currentAssignment && (
          <>
            {allCaughtUp && (
              <div className="card" style={{ marginBottom: 18, textAlign: 'center' }}>
                <strong>🎉 All assignments for this week are complete!</strong>
                <p className="text-soft" style={{ marginTop: 6 }}>
                  Showing Day {currentAssignment.dayNumber} again — add a new week in{' '}
                  <code>manifest.json</code> to keep going.
                </p>
              </div>
            )}
            <TodayView
              kid={activeKid}
              assignment={currentAssignment}
              progress={progress?.assignments[currentAssignment.id]}
              onToggleSection={handleToggleSection}
              onViewAssignment={() => setView('assignment')}
              onTakeQuiz={() => setView('quiz')}
              onParentReview={() => setView('review')}
              onViewProgress={() => setView('progress')}
              onSwitchKid={handleSwitchKid}
            />
          </>
        )}

        {view === 'assignment' && activeKid && currentAssignment && (
          <AssignmentView
            assignment={currentAssignment}
            progress={progress?.assignments[currentAssignment.id]}
            onToggleSection={handleToggleSection}
            onBack={() => setView('today')}
            onTakeQuiz={() => setView('quiz')}
          />
        )}

        {view === 'quiz' && activeKid && currentAssignment && (
          <QuizView
            childId={activeKid.id}
            assignment={currentAssignment}
            existingResult={progress?.assignments[currentAssignment.id]?.quizResult}
            onSubmit={handleQuizSubmit}
            onBack={() => setView('today')}
            onContinueToReview={() => setView('review')}
          />
        )}

        {view === 'review' && activeKid && currentAssignment && (
          <ParentReviewView
            childId={activeKid.id}
            assignment={currentAssignment}
            existingReview={progress?.assignments[currentAssignment.id]?.parentReview}
            onSave={handleSaveReview}
            onBack={() => setView('today')}
          />
        )}

        {view === 'export' && activeKid && currentAssignment && lastSavedReview && (
          <ResultExport
            kid={activeKid}
            assignment={currentAssignment}
            review={lastSavedReview}
            onBackToToday={handleBackToTodayFromExport}
          />
        )}

        {view === 'progress' && activeKid && progress && (
          <ProgressView kid={activeKid} progress={progress} assignments={assignments} onBack={() => setView('today')} />
        )}
      </main>
    </div>
  );
}
