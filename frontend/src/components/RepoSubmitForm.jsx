import { useState } from 'react'
import { submitRepository } from '../api/repositories'

export default function RepoSubmitForm({ onSubmitted }) {
  const [githubUrl, setGithubUrl] = useState('')
  const [branch, setBranch] = useState('main')
  const [commitDepth, setCommitDepth] = useState('full')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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

  return (
    <form onSubmit={handleSubmit}
      className="mt-12 w-[92%] max-w-[620px] p-8 text-left
                 bg-cream/5 backdrop-blur-2xl backdrop-saturate-150
                 rounded-[22px] shadow-[0_24px_60px_rgba(10,16,26,0.45)]">

      <label className="block mb-2.5 text-[11px] font-bold tracking-[0.08em] uppercase text-cream/55">
        Repository URL
      </label>
      <div className="flex items-center gap-2.5 px-4 py-3.5 rounded-xl
                       bg-cream/6 border border-cream/16
                       focus-within:border-cream/45 focus-within:bg-cream/9 transition-colors">
        <svg viewBox="0 0 24 24" fill="#e8dcc4" className="w-4 h-4 opacity-55 shrink-0">
          <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.53-1.33-1.29-1.69-1.29-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.18 1.18.92-.26 1.9-.39 2.88-.39.98 0 1.96.13 2.88.39 2.21-1.49 3.18-1.18 3.18-1.18.63 1.58.23 2.75.11 3.04.74.8 1.19 1.82 1.19 3.08 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.07.78 2.15v3.19c0 .31.21.67.8.56C20.21 21.38 23.5 17.08 23.5 12 23.5 5.73 18.27.5 12 .5z" />
        </svg>
        <input
          type="text"
          value={githubUrl}
          onChange={(e) => setGithubUrl(e.target.value)}
          placeholder="github.com/user/repository"
          required
          className="w-full bg-transparent border-none outline-none text-cream text-[14.5px] font-medium placeholder:text-cream/40"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
        <div>
          <label className="block mb-2.5 text-[11px] font-bold tracking-[0.08em] uppercase text-cream/55">
            Branch
          </label>
          <div className="px-4 py-3.5 rounded-xl bg-cream/6 border border-cream/16
                          focus-within:border-cream/45 focus-within:bg-cream/9 transition-colors">
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-cream text-[14.5px] font-medium"
            />
          </div>
        </div>
        <div>
          <label className="block mb-2.5 text-[11px] font-bold tracking-[0.08em] uppercase text-cream/55">
            Commit depth
          </label>
          <div className="px-4 py-3.5 rounded-xl bg-cream/6 border border-cream/16
                           focus-within:border-cream/45 focus-within:bg-cream/9 transition-colors">
            <select
              value={commitDepth}
              onChange={(e) => setCommitDepth(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-cream text-[14.5px] font-medium appearance-none cursor-pointer"
            >
              <option className="bg-cream text-navy1" value="full">Full history</option>
              <option className="bg-cream text-navy1" value="100">Last 100 commits</option>
              <option className="bg-cream text-navy1" value="500">Last 500 commits</option>
            </select>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-6 py-3.5 rounded-xl bg-cream text-navy1 font-bold text-[15px]
                   shadow-[0_10px_26px_rgba(232,220,196,0.18)]
                   hover:-translate-y-px active:translate-y-0 transition-transform disabled:opacity-50"
      >
        {loading ? 'Analyzing…' : 'Analyze repository'}
      </button>

      {error && <p className="mt-3 text-sm text-cream/80">{error}</p>}
    </form>
  )
}