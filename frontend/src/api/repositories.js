export async function submitRepository(githubUrl, config) {
  const res = await fetch('/repositories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ github_url: githubUrl, config }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Submission failed')
  return data
}

export async function fetchRepositories() {
  const res = await fetch('/repositories')
  if (!res.ok) throw new Error('Could not load repositories')
  return res.json()
}