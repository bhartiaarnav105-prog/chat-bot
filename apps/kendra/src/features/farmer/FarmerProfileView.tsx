import React from 'react';
import { t } from '../../i18n';
import type { SupportedLocale } from '../../i18n';

interface FarmerProfile {
  id: string;
  village?: string;
  preferredLanguage?: string;
}

interface FarmerProfileViewProps {
  profile: FarmerProfile;
  locale: SupportedLocale;
  onRequestCorrection: () => void;
  onRequestDeletion: () => void;
  onWithdrawConsent: () => void;
}

export function FarmerProfileView({
  profile, locale, onRequestCorrection, onRequestDeletion, onWithdrawConsent
}: FarmerProfileViewProps) {
  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '1.5rem', fontFamily: 'sans-serif' }}>
      <h2 style={{ color: '#101B2D', marginBottom: 16 }}>{t('farmer.profile_title', locale)}</h2>

      {/* Minimal profile card — only authorized fields shown */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', borderTop: '3px solid #14AE57', marginBottom: 20 }}>
        <p style={{ margin: '0 0 8px', color: '#45515F', fontSize: 13 }}>Farmer ID</p>
        <p style={{ margin: '0 0 16px', fontWeight: 600, color: '#101B2D' }}>{profile.id}</p>

        {profile.village && (
          <>
            <p style={{ margin: '0 0 4px', color: '#45515F', fontSize: 13 }}>Village</p>
            <p style={{ margin: '0 0 16px', fontWeight: 600, color: '#101B2D' }}>{profile.village}</p>
          </>
        )}
      </div>

      {/* Farmer rights actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button onClick={onRequestCorrection} style={actionBtn('#2E78ED')}>
          ✏️ Request Data Correction
        </button>
        <button onClick={onWithdrawConsent} style={actionBtn('#F06B12')}>
          ↩ Withdraw Consent
        </button>
        <button onClick={onRequestDeletion} style={actionBtn('#ef4444')}>
          🗑 Request Data Deletion
        </button>
      </div>
    </div>
  );
}

function actionBtn(color: string): React.CSSProperties {
  return {
    minHeight: 48, padding: '0 20px', borderRadius: 12,
    border: `2px solid ${color}`, background: '#fff',
    color, fontWeight: 600, fontSize: 15, cursor: 'pointer', textAlign: 'left',
  };
}
