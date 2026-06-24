import type { Assignment, AveerScores, ChildId, IrajScores, Kid, ParentReview } from '../types';
import { calculateTotal, MAX_SCORE } from './scoring';

/**
 * Builds the "Copy Result for ChatGPT" text block. The format intentionally
 * matches the template in the project brief so it can be pasted straight
 * into a chat to request the next assignment.
 */
export function buildResultText(kid: Kid, assignment: Assignment, review: ParentReview): string {
  const lines: string[] = [];
  lines.push('Daily Mission Result');
  lines.push('');
  lines.push(`Child: ${kid.name}`);
  lines.push(`Grade: ${kid.gradeLevel}`);
  lines.push(`Assignment Day: ${assignment.dayNumber}`);
  lines.push(`Date: ${review.date}`);
  lines.push('');
  lines.push('Scores:');

  const total = calculateTotal(kid.id, review.scores);
  const max = MAX_SCORE[kid.id];

  if (kid.id === 'iraj') {
    const s = review.scores as IrajScores;
    lines.push(`Math: ${s.math}/10`);
    lines.push(`Writing: ${s.writing}/10`);
    lines.push(`Vocabulary: ${s.vocabulary}/5`);
    lines.push(`Focus: ${s.focus}/5`);
  } else {
    const s = review.scores as AveerScores;
    lines.push(`Reading: ${s.reading}/10`);
    lines.push(`Math: ${s.math}/10`);
    lines.push(`Writing: ${s.writing}/5`);
    lines.push(`Focus: ${s.focus}/5`);
  }
  lines.push(`Total: ${total}/${max}`);
  lines.push('');

  lines.push('Mistakes:');
  if (review.mistakes.length === 0) {
    lines.push('* None noted');
  } else {
    review.mistakes.forEach((m) => lines.push(`* ${m}`));
  }
  lines.push('');

  lines.push('Writing sample:');
  lines.push(review.writingSample.trim() || '[no writing sample provided]');
  lines.push('');

  lines.push('What was hard:');
  lines.push(review.parentNotes.trim() || '[no notes provided]');
  lines.push('');

  lines.push('Request:');
  lines.push('Generate the next assignment based on this score. Focus especially on weak areas.');

  return lines.join('\n');
}

export async function copyResultToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older Safari/iPadOS contexts where the async clipboard
    // API may be unavailable.
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  }
}

export interface ResultExportPayload {
  child: ChildId;
  grade: number;
  assignment: {
    id: string;
    dayNumber: number;
    title: string;
  };
  review: ParentReview;
  total: number;
  maxTotal: number;
}

export function buildResultJson(kid: Kid, assignment: Assignment, review: ParentReview): ResultExportPayload {
  return {
    child: kid.id,
    grade: kid.gradeLevel,
    assignment: {
      id: assignment.id,
      dayNumber: assignment.dayNumber,
      title: assignment.title,
    },
    review,
    total: calculateTotal(kid.id, review.scores),
    maxTotal: MAX_SCORE[kid.id],
  };
}

export function downloadJson(filename: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
