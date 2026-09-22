import { useState } from 'react'
import { submitRepository } from '../api/repositories'

// GitHub icon shared between form and demo chips
function GitHubIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.53-1.33-1.29-1.69-1.29-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.18 1.18.92-.26 1.9-.39 2.88-.39.98 0 1.96.13 2.88.39 2.21-1.49 3.18-1.18 3.18-1.18.63 1.58.23 2.75.11 3.04.74.8 1.19 1.82 1.19 3.08 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.07.78 2.15v3.19c0 .31.21.67.8.56C20.21 21.38 23.5 17.08 23.5 12 23.5 5.73 18.27.5 12 .5z" />
    </svg>
  )
}

// Demo chip button
function DemoChip({ repo, onSelect }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      type="button"
      onClick={() => onSelect(repo)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(27,106,76,0.08)' : '#FFFFFF',
        border: `1px solid ${hovered ? '#1B6A4C' : 'rgba(18,27,22,0.11)'}`,
        color: hovered ? '#1B6A4C' : '#4A5B52',
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
        padding: '4px 11px',
        borderRadius: '7px',
        fontFamily: '"IBM Plex Mono", monospace',
        fontSize: '11.5px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        boxShadow: '0 1px 2px rgba(18,27,22,0.03)',
      }}
    >
      <GitHubIcon size={11} />
      {repo}
    </button>
  )
}

export default function RepoSubmitForm({ onSubmitted }) {
  const [githubUrl, setGithubUrl] = useState('')
  const [branch, setBranch] = useState('main')
  const [commitDepth, setCommitDepth] = useState('full')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // ── Backend wiring — unchanged ──────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const repo = await submitRepository(githubUrl, {
        erosion_threshold: 70,
        branch,
        commit_depth: commitDepth,
      })
      setGithubUrl('')
      onSubmitted(repo)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function setDemoRepo(repo) {
    setGithubUrl(repo)
  }
  // ────────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Card */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid rgba(18,27,22,0.11)',
          borderRadius: '16px',
          padding: '32px 34px',
          boxShadow: '0 12px 32px -4px rgba(18,27,22,0.07), 0 2px 6px rgba(18,27,22,0.03)',
        }}
      >
        <h2
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: '19px',
            fontWeight: 600,
            letterSpacing: '-0.015em',
            color: '#121B16',
            marginBottom: '6px',
          }}
        >
          Analyze a repository
        </h2>
        <p
          style={{
            fontSize: '13.5px',
            color: '#4A5B52',
            lineHeight: 1.55,
            marginBottom: '22px',
          }}
        >
          Point InterfaceGuard at any public repository to audit interface hygiene across git commits.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Repository URL */}
          <div>
            <label
              htmlFor="repo-input"
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: '#4A5B52',
                marginBottom: '7px',
              }}
            >
              Repository URL
            </label>
            <InputBox icon={<GitHubIcon size={15} />}>
              <input
                id="repo-input"
                type="text"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="github.com/organization/repository"
                required
                style={inputStyle}
              />
            </InputBox>
          </div>

          {/* Branch + Depth row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginTop: '15px',
            }}
          >
            {/* Branch */}
            <div>
              <label
                htmlFor="branch-input"
                style={labelStyle}
              >
                Branch
              </label>
              <InputBox
                icon={
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <line x1="6" y1="3" x2="6" y2="15" />
                    <circle cx="18" cy="6" r="3" />
                    <circle cx="6" cy="18" r="3" />
                    <path d="M18 9a9 9 0 0 1-9 9" />
                  </svg>
                }
              >
                <input
                  id="branch-input"
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  style={inputStyle}
                />
              </InputBox>
            </div>

            {/* Commit depth */}
            <div>
              <label
                htmlFor="depth-input"
                style={labelStyle}
              >
                Commit depth
              </label>
              <InputBox
                icon={
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="4" />
                    <line x1="1.05" y1="12" x2="7" y2="12" />
                    <line x1="17.01" y1="12" x2="22.96" y2="12" />
                  </svg>
                }
              >
                <select
                  id="depth-input"
                  value={commitDepth}
                  onChange={(e) => setCommitDepth(e.target.value)}
                  style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
                >
                  <option value="full">Full history</option>
                  <option value="100">Last 100 commits</option>
                  <option value="500">Last 500 commits</option>
                </select>
              </InputBox>
            </div>
          </div>

          {/* Submit */}
          <AnalyzeButton loading={loading} />

          {error && (
            <p style={{ marginTop: '10px', fontSize: '13px', color: '#B43324' }}>{error}</p>
          )}
        </form>
      </div>

      {/* Demo chips */}
      <div
        style={{
          marginTop: '16px',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          fontSize: '12.5px',
          color: '#4A5B52',
        }}
      >
        <span style={{ fontWeight: 500, color: '#798C81' }}>Try demo:</span>
        <DemoChip repo="spring-projects/spring-framework" onSelect={setDemoRepo} />
        <DemoChip repo="apache/kafka" onSelect={setDemoRepo} />
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function InputBox({ icon, children }) {
  const [focused, setFocused] = useState(false)
  return (
    <div
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={() => setFocused(false)}
      style={{
        width: '100%',
        height: '42px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '0 13px',
        background: focused ? '#FFFFFF' : '#F8FAF9',
        border: `1px solid ${focused ? '#1B6A4C' : 'rgba(18,27,22,0.11)'}`,
        borderRadius: '7px',
        boxShadow: focused ? '0 0 0 3px rgba(27,106,76,0.08)' : 'none',
        transition: 'all 0.15s ease',
        color: '#798C81',
      }}
    >
      {icon}
      {children}
    </div>
  )
}

function AnalyzeButton({ loading }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      type="submit"
      disabled={loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        marginTop: '22px',
        height: '44px',
        border: 'none',
        borderRadius: '7px',
        background: '#1B6A4C',
        color: '#FFFFFF',
        fontFamily: "'Inter', sans-serif",
        fontSize: '14px',
        fontWeight: 600,
        letterSpacing: '-0.01em',
        cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        opacity: loading ? 0.7 : 1,
        transform: hovered && !loading ? 'translateY(-1px)' : 'translateY(0)',
        boxShadow: hovered && !loading
          ? '0 4px 14px rgba(27,106,76,0.32)'
          : '0 2px 10px rgba(27,106,76,0.22)',
        transition: 'all 0.15s ease',
      }}
    >
      {loading ? 'Analyzing…' : 'Analyze repository'}
    </button>
  )
}

// Shared styles
const labelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: '#4A5B52',
  marginBottom: '7px',
}

const inputStyle = {
  width: '100%',
  background: 'transparent',
  border: 'none',
  outline: 'none',
  color: '#121B16',
  fontFamily: "'Inter', system-ui, sans-serif",
  fontSize: '13.5px',
  fontWeight: 500,
}