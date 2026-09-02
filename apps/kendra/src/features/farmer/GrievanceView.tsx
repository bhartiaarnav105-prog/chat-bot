import React, { useState } from 'react';
import { t } from '../../i18n';
import type { SupportedLocale } from '../../i18n';

interface GrievanceEvent {
  status: string;
  notes?: string;
  createdAt: string;
}

interface GrievanceViewProps {
  locale: SupportedLocale;
  farmerId: string;
  existingEvents?: GrievanceEvent[];
}

export function GrievanceView({ locale, farmerId, existingEvents = [] }: GrievanceViewProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/v1/grievances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Grievance content is separate from AI retrieval data
        body: JSON.stringify({ farmerId, title, description }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || data.error || 'Unable to submit grievance');
      }
      setSubmitted(data.data?.id ?? 'submitted');
      setTitle('');
      setDescription('');
    } catch {
      setSubmitted('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.5rem', fontFamily: 'sans-serif' }}>

      {/* Create Grievance Form */}
      <h2 style={{ color: '#101B2D', marginBottom: 16 }}>{t('grievance.create_title', locale)}</h2>
      {submitted ? (
        <div role="status" style={{ padding: 16, background: '#C8F7E2', borderRadius: 12, color: '#0B8A45', fontWeight: 600 }}>
          ✓ {t('grievance.submitted', locale, { id: submitted })}
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ fontWeight: 600, color: '#101B2D' }}>
            Title
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              style={{ display: 'block', width: '100%', marginTop: 4, padding: '10px 14px', borderRadius: 10, border: '2px solid #E4ECE8', fontSize: 15 }}
            />
          </label>
          <label style={{ fontWeight: 600, color: '#101B2D' }}>
            Description
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
              rows={4}
              style={{ display: 'block', width: '100%', marginTop: 4, padding: '10px 14px', borderRadius: 10, border: '2px solid #E4ECE8', fontSize: 15, resize: 'vertical' }}
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            style={{ minHeight: 52, borderRadius: 999, border: 'none', background: '#F06B12', color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}
          >
            {loading ? t('common.loading', locale) : `⚠ ${t('grievance.submit', locale)}`}
          </button>
        </form>
      )}

      {/* Grievance Status History */}
      {existingEvents.length > 0 && (
        <>
          <h3 style={{ color: '#101B2D', marginTop: 32, marginBottom: 12 }}>{t('grievance.status_title', locale)}</h3>
          {existingEvents.map((event, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12, paddingLeft: 8, borderLeft: '3px solid #F06B12' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 600, color: '#101B2D' }}>{event.status}</p>
                {event.notes && <p style={{ margin: '2px 0 0', fontSize: 13, color: '#45515F' }}>{event.notes}</p>}
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#45515F' }}>🕐 {event.createdAt}</p>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
