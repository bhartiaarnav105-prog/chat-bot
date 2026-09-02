import { useState } from 'react';
import { t } from '../../i18n';
import type { SupportedLocale } from '../../i18n';

interface ConsentScreenProps {
  locale: SupportedLocale;
  onAccept: () => void;
  onDecline: () => void;
}

export function ConsentScreen({ locale, onAccept, onDecline }: ConsentScreenProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <div role="main" style={{ maxWidth: 520, margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 24, color: '#101B2D' }}>{t('farmer.consent_title', locale)}</h1>

      <p style={{ color: '#45515F', lineHeight: 1.7, marginBottom: 24 }}>
        {t('farmer.consent_body', locale)}
      </p>

      {/* Accessible checkbox */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={e => setAcknowledged(e.target.checked)}
          style={{ width: 24, height: 24, cursor: 'pointer' }}
          aria-label="I understand and give my consent"
        />
        <span style={{ fontSize: 15 }}>{t('farmer.consent_body', locale)}</span>
      </label>

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={onAccept}
          disabled={!acknowledged}
          style={{
            flex: 1, minHeight: 52, borderRadius: 999, border: 'none',
            background: acknowledged ? '#14AE57' : '#E4ECE8',
            color: acknowledged ? '#fff' : '#45515F',
            fontWeight: 700, fontSize: 16, cursor: acknowledged ? 'pointer' : 'not-allowed',
          }}
        >
          ✓ {t('farmer.consent_accept', locale)}
        </button>
        <button
          onClick={onDecline}
          style={{
            flex: 1, minHeight: 52, borderRadius: 999,
            border: '2px solid #E4ECE8', background: '#fff',
            color: '#45515F', fontWeight: 600, fontSize: 16, cursor: 'pointer',
          }}
        >
          {t('common.cancel', locale)}
        </button>
      </div>
    </div>
  );
}
