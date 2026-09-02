import React, { useState } from 'react';

const API_BASE = '/api/v1';

type ReviewStatus = 'approved' | 'rejected' | 'expired';

export function ReviewDashboard() {
  const [versionId, setVersionId] = useState('');
  const [reviewerId, setReviewerId] = useState('');
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>('approved');
  const [message, setMessage] = useState('');

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/schemes/versions/${versionId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewStatus, reviewerId }),
      });
      const data = await res.json();
      setMessage(`Version ${data.data?.id} status set to: ${data.data?.reviewStatus}`);
    } catch {
      setMessage('Error submitting review.');
    }
  };

  return (
    <div style={{ padding: '1rem', border: '1px solid #ccc', marginBottom: '1rem' }}>
      <h2>Review Scheme Version</h2>
      <form onSubmit={handleReview}>
        <label>Scheme Version ID: <input value={versionId} onChange={e => setVersionId(e.target.value)} required /></label><br />
        <label>Reviewer ID: <input value={reviewerId} onChange={e => setReviewerId(e.target.value)} required /></label><br />
        <label>
          Status:{' '}
          <select value={reviewStatus} onChange={e => setReviewStatus(e.target.value as ReviewStatus)}>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
          </select>
        </label><br />
        <button type="submit" style={{ marginTop: '0.5rem' }}>Submit Review</button>
      </form>
      {message && <p aria-live="polite">{message}</p>}
    </div>
  );
}
