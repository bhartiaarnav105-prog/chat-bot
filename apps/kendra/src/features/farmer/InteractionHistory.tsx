import React from 'react';
import { t } from '../../i18n';
import type { SupportedLocale } from '../../i18n';

interface GuidanceItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface InteractionHistoryProps {
  locale: SupportedLocale;
  isAuthorized: boolean;
  savedGuidance: GuidanceItem[];
  onPrint: (item: GuidanceItem) => void;
}

export function InteractionHistory({ locale, isAuthorized, savedGuidance, onPrint }: InteractionHistoryProps) {
  // History only shown after authorization — never without explicit auth gate
  if (!isAuthorized) {
    return (
      <div role="alert" style={{ padding: 20, background: '#FEF2F2', borderRadius: 12, color: '#B91C1C', textAlign: 'center' }}>
        <p>🔒 {t('errors.auth', locale)}</p>
      </div>
    );
  }

  if (savedGuidance.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: '#45515F' }}>
        <p>📭 No saved guidance yet.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.5rem', fontFamily: 'sans-serif' }}>
      <h2 style={{ color: '#101B2D', marginBottom: 16 }}>{t('farmer.history_title', locale)}</h2>
      {savedGuidance.map(item => (
        <div key={item.id} style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, boxShadow: '0 2px 6px rgba(0,0,0,0.06)', borderTop: '3px solid #2E78ED' }}>
          <p style={{ margin: '0 0 6px', fontWeight: 600, color: '#101B2D' }}>{item.title}</p>
          <p style={{ margin: '0 0 12px', color: '#45515F', fontSize: 14, lineHeight: 1.6 }}>{item.content}</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#45515F' }}>🕐 {item.createdAt}</span>
            <button
              onClick={() => onPrint(item)}
              style={{ marginLeft: 'auto', minHeight: 40, padding: '0 16px', borderRadius: 999, border: '2px solid #14AE57', background: '#fff', color: '#14AE57', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
            >
              🖨 Print
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
