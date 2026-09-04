# InterfaceGuard

**An AI-assisted tool for detecting object-oriented interface erosion**

InterfaceGuard analyzes the commit history of a Java repository to catch a design smell most static analysis tools miss: *interface erosion* — the slow accumulation of unrelated responsibilities onto an interface as a codebase evolves. It combines rule-based metrics with LLM-generated explanations so developers don't just see a warning, they understand *why* it happened and *how* to fix it.

---

## The Problem

As object-oriented software grows through repeated changes, interfaces tend to pick up methods they were never designed for. This shows up as:

- Bloated interfaces with too many responsibilities
- Violations of the Interface Segregation Principle (ISP)
- Implementing classes forced to write empty or unused method bodies

Most free static analysis tools flag this at a single point in time. None of them track how an interface's design quality *changes across history*, and none explain the erosion in plain language or suggest a fix. InterfaceGuard does both.

## How It Works

1. **Extraction** — [JavaParser](https://javaparser.org/) pulls every interface definition and its implementing classes from selected commits, walked via [PyDriller](https://pydriller.readthedocs.io/).
2. **Metrics** — For each interface snapshot, InterfaceGuard computes:
   - Method-count growth
   - ISP violation ratio (empty/unused method bodies in implementers)
   - Interface dependency count
   - Interface churn (how often members change across commits)
   - Breaking change count (removed/renamed methods)
   - A derived **Interface Health Score** combining all of the above
3. **Flagging** — An interface is flagged as eroding when method count spikes, ISP violation or churn crosses a threshold, or the Health Score drops below an acceptable level.
4. **Explanation** — Flagged interfaces (with method list and violation details) are sent to a free-tier LLM API, which returns a plain-language explanation and a concrete refactoring suggestion.
5. **Dashboard** — Results are presented across four views: repository input, live analysis progress, project-wide overview, and per-interface detail with trend charts.

## Tech Stack

| Layer | Tools |
|---|---|
| Static Analysis | JavaParser |
| Git History Mining | PyDriller |
| Backend | Python, Flask |
| Frontend | React, Vite, Tailwind CSS, Recharts |
| Database | SQLite |
| AI | Free-tier LLM API (e.g. Gemini free tier) |

Everything in the stack is free and open-source — no paid hosting, database, or GPU required. The whole prototype runs on a standard laptop.

## Dashboard Views

- **Repository Input** — submit a GitHub URL and configure the analysis
- **Live Analysis** — real-time progress as commits are mined and metrics computed
- **Overview** — all interfaces in the repo with current Health Scores and erosion status
- **Interface Detail** — per-metric trend charts plus the AI-generated explanation and suggested fix

## Status

🚧 In development — MCA Semester 4 mini project (Adi Shankara Institute of Engineering & Technology). Sprint 1 (JavaParser extraction, Flask/React/Vite scaffolding, SQLite, live API connectivity) is complete; metric computation, LLM integration, and the full dashboard are in progress.

## Why This Matters

Premium code-quality tooling is often out of reach for student projects and small dev teams. Because InterfaceGuard is built entirely from free and open-source components, it can be adopted with zero licensing cost, helping teams catch design problems early and keep interfaces maintainable.

## References

See the project synopsis for the full list of cited work on AI-assisted static analysis and software maintainability.

## Author

**Athul Krishna** — MCA, Adi Shankara Institute of Engineering & Technology (affiliated to APJ Abdul Kalam Technological University)
