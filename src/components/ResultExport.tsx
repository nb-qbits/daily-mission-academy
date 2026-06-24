import { useState } from 'react';
import type { Assignment, Kid, ParentReview } from '../types';
import { buildResultJson, buildResultText, copyResultToClipboard, downloadJson } from '../utils/exportText';

interface ResultExportProps {
  kid: Kid;
  assignment: Assignment;
  review: ParentReview;
  onBackToToday: () => void;
}

export default function ResultExport({ kid, assignment, review, onBackToToday }: ResultExportProps) {
  const [copied, setCopied] = useState(false);
  const text = buildResultText(kid, assignment, review);

  async function handleCopy() {
    const ok = await copyResultToClipboard(text);
    setCopied(ok);
    if (ok) {
      setTimeout(() => setCopied(false), 2500);
    }
  }

  function handleDownload() {
    const payload = buildResultJson(kid, assignment, review);
    downloadJson(`daily-mission-${kid.id}-day${assignment.dayNumber}.json`, payload);
  }

  return (
    <div>
      <h2 style={{ marginBottom: 6 }}>Mission Logged! 🎉</h2>
      <p className="text-soft" style={{ marginBottom: 18 }}>
        {kid.name}'s review for Day {assignment.dayNumber} has been saved. Copy the summary below
        and paste it into ChatGPT to generate the next assignment.
      </p>

      <div className="card">
        <div className="section-title">Copy Result for ChatGPT</div>
        <div className="export-preview">{text}</div>
        <div className="export-actions">
          <button className="btn btn-primary" onClick={handleCopy}>
            📋 Copy Result for ChatGPT
          </button>
          <button className="btn btn-secondary" onClick={handleDownload}>
            ⬇️ Download JSON
          </button>
          {copied && <span className="copy-confirm">✓ Copied to clipboard</span>}
        </div>
      </div>

      <button className="btn btn-secondary btn-block spacer-top" onClick={onBackToToday}>
        ← Back to Today
      </button>
    </div>
  );
}
