import { useEffect, useState } from 'react'
import RepoSubmitForm from './components/RepoSubmitForm'
import { fetchRepositories } from './api/repositories'

// ── Diff preview card shown in the left hero column ───────────────────────────
function DiffCard() {
  return (
    <div
      style={{
        marginTop: '28px',
        background: '#FFFFFF',
        border: '1px solid rgba(18,27,22,0.11)',
        borderRadius: '10px',
        overflow: 'hidden',
        maxWidth: '470px',
        boxShadow: '0 4px 20px rgba(18,27,22,0.05), 0 1px 3px rgba(18,27,22,0.04)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: '1px solid rgba(18,27,22,0.11)',
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: '11.5px',
          color: '#4A5B52',
          background: '#EBF0EC',
        }}
      >
        <span>PaymentGateway.java · v2.3 → v2.7</span>
        <span
          style={{
            fontWeight: 600,
            padding: '2px 9px',
            borderRadius: '999px',
            background: 'rgba(27,106,76,0.14)',
            color: '#1B6A4C',
            fontSize: '10.5px',
            letterSpacing: '0.02em',
          }}
        >
          erosion detected
        </span>
      </div>

      {/* Diff lines */}
      <div
        style={{
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: '12px',
          lineHeight: 1.9,
          background: '#FFFFFF',
        }}
      >
        <DiffLine type="ctx" sign=" " code="interface PaymentGateway {" />
        <DiffLine type="ctx" sign=" " code="  Receipt charge(Money amount);" />
        <DiffLine type="rm"  sign="−" code="  void refund(String id);" />
        <DiffLine type="add" sign="+" code="  Receipt refund(String id, Money amt," />
        <DiffLine type="add" sign="+" code="    RefundReason reason, boolean notify);" />
        <DiffLine type="ctx" sign=" " code="}" />
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '9px 16px',
          borderTop: '1px solid rgba(18,27,22,0.11)',
          fontSize: '11.5px',
          lineHeight: 1.5,
          color: '#4A5B52',
          background: '#FFFFFF',
        }}
      >
        Parameter count grew{' '}
        <strong style={{ color: '#121B16', fontWeight: 600 }}>1 → 4</strong>
        {' '}across 6 commits — recommended candidate for parameter object extraction.
      </div>
    </div>
  )
}

function DiffLine({ type, sign, code }) {
  const styles = {
    ctx: { background: 'transparent', color: '#4A5B52' },
    rm:  { background: 'rgba(194,62,46,0.08)', color: '#B43324' },
    add: { background: 'rgba(27,106,76,0.08)', color: '#176345' },
  }
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '24px 1fr',
        padding: '1px 16px 1px 8px',
        whiteSpace: 'pre',
        ...styles[type],
      }}
    >
      <span style={{ userSelect: 'none', fontWeight: 600, textAlign: 'center', opacity: 0.8 }}>
        {sign}
      </span>
      <span>{code}</span>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [repos, setRepos] = useState([])

  // Backend wiring — unchanged
  useEffect(() => {
    fetchRepositories().then(setRepos).catch(() => {})
  }, [])

  return (
    <>
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          className="responsive-grid"
          style={{
            width: '100%',
            maxWidth: '1140px',
            padding: '48px 32px',
            display: 'grid',
            gridTemplateColumns: '1.08fr 0.92fr',
            gap: '60px',
            alignItems: 'center',
          }}
        >
          {/* ── Left: Hero column ── */}
          <section style={{ display: 'flex', flexDirection: 'column' }}>
            <h1
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontSize: 'clamp(36px, 4vw, 48px)',
                fontWeight: 500,
                lineHeight: 1.15,
                letterSpacing: '-0.025em',
                color: '#121B16',
                maxWidth: '500px',
              }}
            >
              Understand how your{' '}
              <span
                style={{
                  position: 'relative',
                  display: 'inline-block',
                  fontStyle: 'italic',
                  fontWeight: 400,
                  color: '#1B6A4C',
                  whiteSpace: 'nowrap',
                }}
              >
                interfaces
                {/* Organic underline SVG */}
                <svg
                  viewBox="0 0 140 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="none"
                  style={{
                    position: 'absolute',
                    left: '-2%',
                    bottom: '-6px',
                    width: '104%',
                    height: '9px',
                    color: '#2A8C66',
                    pointerEvents: 'none',
                    opacity: 0.85,
                  }}
                >
                  <path
                    d="M3 8.5C36.5 3.5 98.5 2.5 137 9"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>{' '}
              evolve.
            </h1>

            <p
              style={{
                marginTop: '18px',
                maxWidth: '440px',
                fontSize: '15px',
                lineHeight: 1.6,
                color: '#4A5B52',
              }}
            >
              Analyze your Java codebase across Git history to spot interface pollution, track
              contract drift, and safeguard architectural boundaries.
            </p>

            <DiffCard />
          </section>

          {/* ── Right: Form column ── */}
          <section style={{ display: 'flex', flexDirection: 'column' }}>
            <RepoSubmitForm onSubmitted={(repo) => setRepos([repo, ...repos])} />
          </section>
        </div>
      </div>

      {/* Responsive collapse at ≤ 960 px */}
      <style>{`
        @media (max-width: 960px) {
          .responsive-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
            padding: 32px 20px 48px !important;
          }
        }
      `}</style>
    </>
  )
}