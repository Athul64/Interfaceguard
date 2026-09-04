import { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import RepoSubmitForm from './components/RepoSubmitForm'
import { fetchRepositories } from './api/repositories'

export default function App() {
  const [repos, setRepos] = useState([])

  useEffect(() => {
    fetchRepositories().then(setRepos).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen font-raleway text-cream">
      <Navbar />
      <main className="flex flex-col items-center text-center pt-40 pb-20 px-6">
        <h1 className="max-w-[820px] text-[38px] sm:text-[52px] lg:text-[64px] font-extrabold leading-[1.08] tracking-tight">
          Understand how your<br />
          <em className="italic font-light text-cream/60">interfaces</em> evolve.
        </h1>

        <p className="mt-5 max-w-[560px] text-[16.5px] leading-[1.65] text-cream/70">
          Analyze your Java repository across Git history to detect interface erosion,
          measure design health, and understand what to refactor.
        </p>

        <RepoSubmitForm onSubmitted={(repo) => setRepos([repo, ...repos])} />

        <p className="mt-8 text-[13px] text-cream/50">
          Try a demo:{' '}
          <a href="#" className="text-cream/85 underline underline-offset-4 decoration-cream/35">
            github.com/spring-projects/spring-framework
          </a>
          <span className="mx-2.5 opacity-40">·</span>
          <a href="#" className="text-cream/85 underline underline-offset-4 decoration-cream/35">
            github.com/athul/project
          </a>
        </p>
      </main>
    </div>
  )
}