import React, { useState } from 'react';

const API_BASE = '/api/v1';

export function DocumentUploader() {
  const [schemeVersionId, setSchemeVersionId] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [language, setLanguage] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/knowledge-documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schemeVersionId, fileUrl, language, title: docTitle }),
      });
      const data = await res.json();
      setMessage(`Document ingested: ${data.data?.chunksCount} chunks created.`);
    } catch {
      setMessage('Error submitting document.');
    }
  };

  return (
    <div style={{ padding: '1rem', border: '1px solid #ccc', marginBottom: '1rem' }}>
      <h2>Register Source Document</h2>
      <form onSubmit={handleSubmit}>
        <label>Scheme Version ID: <input value={schemeVersionId} onChange={e => setSchemeVersionId(e.target.value)} required /></label><br />
        <label>Document Title: <input value={docTitle} onChange={e => setDocTitle(e.target.value)} required /></label><br />
        <label>Official Source URL: <input value={fileUrl} onChange={e => setFileUrl(e.target.value)} required /></label><br />
        <label>Language Code: <input value={language} onChange={e => setLanguage(e.target.value)} placeholder="e.g. hi, en, mr" required /></label><br />
        <button type="submit" style={{ marginTop: '0.5rem' }}>Ingest Document</button>
      </form>
      {message && <p aria-live="polite">{message}</p>}
    </div>
  );
}
