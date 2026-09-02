import { useState } from 'react'
import './index.css'
import { t, LANGUAGE_LABELS } from './i18n'
import type { SupportedLocale } from './i18n'
import { ConsentScreen } from './features/farmer/ConsentScreen'
import { FarmerProfileView } from './features/farmer/FarmerProfileView'
import { AskJourney } from './features/farmer/AskJourney'
import { InteractionHistory } from './features/farmer/InteractionHistory'
import { GrievanceView } from './features/farmer/GrievanceView'

type Page = 'home' | 'ask' | 'consent' | 'profile' | 'history' | 'grievance'

function App() {
  const [locale, setLocale] = useState<SupportedLocale>('en')
  const [page, setPage] = useState<Page>('home')
  const [consented, setConsented] = useState(false)

  return (
    <div className="ss-fade-in">
      {/* ───── Header ───── */}
      <header className="ss-header">
        <a href="#" className="ss-header__logo" onClick={() => setPage('home')}>
          🌾 Sahakaar Sathi
        </a>
        <nav className="ss-header__nav">
          <button className="ss-btn ss-btn--secondary" onClick={() => setPage('home')}>
            🏠 Home
          </button>
          {consented && (
            <>
              <button className="ss-btn ss-btn--secondary" onClick={() => setPage('history')}>
                📋 History
              </button>
              <button className="ss-btn ss-btn--secondary" onClick={() => setPage('grievance')}>
                ⚠ Grievance
              </button>
              <button className="ss-btn ss-btn--secondary" onClick={() => setPage('profile')}>
                👤 Profile
              </button>
            </>
          )}
          {/* Language Selector */}
          <select
            value={locale}
            onChange={e => setLocale(e.target.value as SupportedLocale)}
            className="ss-input"
            aria-label={t('language.select_language', locale)}
            style={{ width: 'auto', minWidth: 120, minHeight: 48 }}
          >
            {Object.entries(LANGUAGE_LABELS).slice(0, 5).map(([code, label]) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
        </nav>
      </header>

      {/* ───── Page Content ───── */}
      <main className="ss-container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-3xl)' }}>

        {/* Home Page */}
        {page === 'home' && (
          <div className="ss-fade-in">
            {/* Hero */}
            <section style={{ textAlign: 'center', padding: 'var(--space-3xl) 0 var(--space-xl)' }}>
              <h1 style={{ marginBottom: 'var(--space-md)' }}>
                🌾 Sahakaar Sathi Kendra
              </h1>
              <p style={{ fontSize: 'var(--font-size-lg)', maxWidth: 600, margin: '0 auto var(--space-xl)' }}>
                Your trusted cooperative service assistant. Get scheme information, file grievances, and access government services — by voice or text, in your language.
              </p>

              {/* Primary CTA */}
              {consented ? (
                <button
                  className="ss-btn ss-btn--primary ss-btn--large"
                  onClick={() => setPage('ask')}
                >
                  🎤 Ask a Question
                </button>
              ) : (
                <button
                  className="ss-btn ss-btn--primary ss-btn--large"
                  onClick={() => setPage('consent')}
                >
                  ✓ Get Started
                </button>
              )}
            </section>

            {/* Service Categories */}
            <section>
              <h2 style={{ marginBottom: 'var(--space-md)' }}>Services</h2>
              <div className="ss-categories">
                <div className="ss-category-card" onClick={() => consented ? setPage('ask') : setPage('consent')}>
                  <div className="ss-category-card__icon">🌱</div>
                  <div className="ss-category-card__title">Crop Insurance</div>
                </div>
                <div className="ss-category-card" onClick={() => consented ? setPage('ask') : setPage('consent')}>
                  <div className="ss-category-card__icon">💰</div>
                  <div className="ss-category-card__title">Subsidies & Benefits</div>
                </div>
                <div className="ss-category-card" onClick={() => consented ? setPage('ask') : setPage('consent')}>
                  <div className="ss-category-card__icon">📋</div>
                  <div className="ss-category-card__title">Cooperative Schemes</div>
                </div>
                <div className="ss-category-card" onClick={() => setPage('grievance')}>
                  <div className="ss-category-card__icon">⚠️</div>
                  <div className="ss-category-card__title">File Grievance</div>
                </div>
              </div>
            </section>

            {/* Offline / Sync Status Badge */}
            <div style={{ textAlign: 'center', marginTop: 'var(--space-xl)' }}>
              <span className="ss-badge ss-badge--success">● Online</span>
            </div>
          </div>
        )}

        {/* Consent Screen */}
        {page === 'consent' && (
          <ConsentScreen
            locale={locale}
            onAccept={() => { setConsented(true); setPage('ask'); }}
            onDecline={() => setPage('home')}
          />
        )}

        {/* Ask Journey */}
        {page === 'ask' && consented && (
          <AskJourney
            locale={locale}
            farmerId="demo-farmer-001"
            onSaveGuidance={() => alert(t('farmer.guidance_saved', locale))}
          />
        )}

        {/* Profile */}
        {page === 'profile' && consented && (
          <FarmerProfileView
            locale={locale}
            profile={{ id: 'demo-farmer-001', village: 'Village A' }}
            onRequestCorrection={() => alert('Correction request sent.')}
            onRequestDeletion={() => alert('Deletion request sent.')}
            onWithdrawConsent={() => { setConsented(false); setPage('home'); }}
          />
        )}

        {/* History */}
        {page === 'history' && (
          <InteractionHistory
            locale={locale}
            isAuthorized={consented}
            savedGuidance={[
              { id: '1', title: 'PMFBY Information', content: 'Farmers pay 2% premium under PMFBY.', createdAt: '2024-01-15' }
            ]}
            onPrint={() => { window.print(); }}
          />
        )}

        {/* Grievance */}
        {page === 'grievance' && (
          <GrievanceView
            locale={locale}
            farmerId="demo-farmer-001"
            existingEvents={[
              { status: 'Submitted', notes: 'Grievance filed by farmer.', createdAt: '2024-01-10' },
              { status: 'Under Review', notes: 'Assigned to operator.', createdAt: '2024-01-12' },
            ]}
          />
        )}
      </main>
    </div>
  )
}

export default App
