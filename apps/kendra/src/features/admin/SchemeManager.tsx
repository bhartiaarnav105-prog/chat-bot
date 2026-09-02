import React, { useState } from 'react';

const API_BASE = '/api/v1';

export function SchemeManager() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');

  const handleCreateScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/schemes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category }),
      });
      const data = await res.json();
      setMessage(`Scheme created: ${data.data?.id}`);
      setTitle('');
      setCategory('');
    } catch {
      setMessage('Error creating scheme.');
    }
  };

  return (
    <div style={{ padding: '1rem', border: '1px solid #ccc', marginBottom: '1rem' }}>
      <h2>Create Scheme</h2>
      <form onSubmit={handleCreateScheme}>
        <label>
          Title:
          <input value={title} onChange={e => setTitle(e.target.value)} required style={{ marginLeft: '0.5rem' }} />
        </label>
        <br />
        <label style={{ marginTop: '0.5rem', display: 'block' }}>
          Category:
          <input value={category} onChange={e => setCategory(e.target.value)} required style={{ marginLeft: '0.5rem' }} />
        </label>
        <br />
        <button type="submit" style={{ marginTop: '0.5rem' }}>Create Scheme</button>
      </form>
      {message && <p aria-live="polite">{message}</p>}
    </div>
  );
}
