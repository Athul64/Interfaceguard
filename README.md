# InterfaceGuard — AI-Assisted Object-Oriented Interface Erosion Auditor

[![Python 3.14+](https://img.shields.io/badge/Python-3.14+-2E4036.svg)](https://python.org)
[![React 19](https://img.shields.io/badge/React-19-CC5833.svg)](https://react.dev)
[![JavaParser 3.26.2](https://img.shields.io/badge/JavaParser-3.26.2-2E4036.svg)](https://javaparser.org)
[![Tests Passing](https://img.shields.io/badge/Tests-43%20Passed-2E4036.svg)](backend/tests)
[![License: MIT](https://img.shields.io/badge/License-MIT-CC5833.svg)](LICENSE)

**InterfaceGuard** is a history-aware software engineering tool that audits object-oriented interface erosion in Java repositories across Git history.

As software evolves, interfaces accumulate unrelated responsibilities, violate the Interface Segregation Principle (ISP), form dependency cycles, and force implementors to provide empty or exception-throwing stubs. InterfaceGuard surfaces these problems, traces historical change points, explains the design decay in plain language, and generates downloadable PDF audit reports.

---

## Visual Identity: Software Architecture Field Journal

InterfaceGuard's interface is built as a technical architecture instrument using the **Software Architecture Field Journal** palette:

- **Deep Forest Green (`#2E4036`):** Structural elements, healthy indicators, primary actions.
- **Erosion Clay (`#CC5833`):** Erosion warnings, ISP stub highlights, dependency cycle callouts.
- **Warm Paper Cream (`#F2F0E9`):** Surface backgrounds, subtle grid textures, data cards.
- **Charcoal (`#1A1A1A`):** High-contrast typography and borders.

Typography:
- **Plus Jakarta Sans:** Main headings, numbers, and branding.
- **Outfit:** Navigation, tables, and analytical copy.
- **Cormorant Garamond (Italic):** Editorial accents and historical quotes.
- **IBM Plex Mono:** Commit hashes, file paths, and metric identifiers.

---

## Key Features

1. **JavaParser 3.26.2 AST Static Bridge:**
   - Real AST extraction of Java interfaces, implementing classes, method signatures, line numbers, and body statements.
   - Built with Maven into a shaded executable jar with a documented `javalang` fallback.
2. **Interface Segregation Principle (ISP) Violation Detection:**
   - Detects `throw new UnsupportedOperationException()`, `throw new NotImplementedException()`, empty bodies (`{}`), no-op comment stubs, and placeholder return values (`return null;`, `return false;`).
3. **Chidamber & Kemerer (CK) Metrics Aggregation:**
   - Computes CBO, LCOM, RFC, WMC, DIT, and NOC aggregated over concrete implementing classes.
4. **Interface Erosion & Churn Metrics:**
   - Method count growth, parameter-sharing cohesion (LACC), cumulative churn, and breaking change detection.
5. **Interactive NetworkX & React Flow Dependency Graph:**
   - Directed type relationships (`implements`, `depends_on`, `extends`).
   - Cycles detected via NetworkX and prominently highlighted in Clay (`#CC5833`) with an accessible table alternative.
6. **Time-Series Change-Point Detection (CUSUM):**
   - Identifies commits that introduced sudden drops in Health Score ($\Delta \ge 10$ points).
   - Trend classifications: `Stable`, `Rising`, `Accelerating`.
7. **AI-Assisted Architecture Recommendations:**
   - Structured plain-language explanations, maintainability impacts, role-based responsibility separations, and risk analyses.
   - Works with Gemini / OpenAI or a deterministic rule-based expert engine when offline.
8. **Publication-Grade PDF Reporting:**
   - Full reports generated directly by the backend using ReportLab. PDF is the exclusive report format.
9. **Bundled Demonstration Repository:**
   - Includes `sample-repositories/order-service` with a complete 6-commit Git history demonstrating interface evolution, bloat, ISP stubs, signature breaking changes, and cyclic dependencies.

---

## Project Structure

```text
interfaceguard/
├── frontend/
│   ├── src/
│   │   ├── components/layout/    # Navbar & layout primitives
│   │   ├── components/repository/# Analysis progress modal & forms
│   │   ├── context/              # Global AppContext
│   │   ├── pages/                # Overview, Interfaces, Detail, Graph, History, Reports, Intake
│   │   ├── services/             # Typed API client
│   │   ├── types/                # TypeScript models and API contracts
│   │   ├── App.tsx               # Route configurations
│   │   └── main.tsx              # Root entry point
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── app/
│   │   ├── analyzers/            # CK metrics, erosion, ISP, smells, cycles, change-points, AI
│   │   ├── api/                  # REST API v1 endpoints
│   │   ├── core/                 # Configuration and thresholds
│   │   ├── models/               # SQLite models (SQLAlchemy)
│   │   ├── reports/              # ReportLab publication PDF generator
│   │   ├── services/             # Background analysis runner and validation
│   │   └── tools/javaparser-bridge/ # Maven JavaParser 3.26.2 bridge
│   ├── tests/                    # 43 automated backend tests
│   ├── data/                     # SQLite database & generated PDF reports
│   ├── requirements.txt
│   ├── .env.example
│   └── run.py
│
├── sample-repositories/
│   └── order-service/            # Multi-commit Java test repository
├── docs/
│   ├── ARCHITECTURE.md
│   └── EVALUATION.md
└── README.md
```

---

## Quick Start Guide (Windows)

### Prerequisites
- **Python 3.10+** (tested on Python 3.14)
- **Node.js 18+** & **npm**
- **Java JDK 17+** (tested on Java 25 LTS)
- **Git**

---

### Step 1: Backend Setup

Open a PowerShell terminal:

```powershell
# 1. Navigate to backend directory
cd backend

# 2. Configure environment (copy example)
Copy-Item .env.example .env

# 3. Ensure JavaParser bridge is built
mvn -f app/tools/javaparser-bridge/pom.xml package

# 4. Run automated test suite
$env:PYTHONPATH="."
python -m pytest tests

# 5. Start the Flask backend server (runs on port 5000)
python run.py
```

You should see:
```text
* Running on http://127.0.0.1:5000
* InterfaceGuard API v1 active at /api/v1
```

---

### Step 2: Frontend Setup

Open a second PowerShell terminal:

```powershell
# 1. Navigate to frontend directory
cd frontend

# 2. Run Vite build to verify assets
npm.cmd run build

# 3. Start development server
npm.cmd run dev
```

Open your browser to: **`http://localhost:5173`**

---

## Exploring with the Bundled Demo

1. Click **Import Repo** in the top navigation bar.
2. Under the form, click **Load Demo** (`sample-repositories/order-service`).
3. Watch the **11-stage progress modal** audit all 6 commits in real-time.
4. On the **Overview Dashboard**, inspect:
   - **Project Erosion Index:** Observe how health dropped from 100 to 66.8.
   - **Severity Breakdown:** Click **Critical** or **Warning** to filter interfaces.
   - **Historical Evolution:** View the Recharts trend line across commits.
5. Open **Interfaces**:
   - Inspect `OrderService` (Health: 66.8, Methods: 8, Churn: 4).
   - Click to view the forensic page: notice the 4 ISP stubs in `FastTrackOrderService`, the AI refactoring plan, and the CUSUM change point at commit `9cbd0a5`.
6. Open **Dependencies**:
   - View the interactive React Flow graph.
   - See the cyclic dependency between `OrderService` and `BillingService` highlighted in **Clay**.
7. Open **Reports**:
   - Click **Compile & Generate PDF Report**.
   - Download the generated PDF and inspect the publication-ready layout.

---

## API Documentation (`/api/v1`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Health check and database status |
| `POST` | `/api/v1/repositories` | Submit repository URL or local path |
| `GET` | `/api/v1/repositories` | List analyzed repositories |
| `DELETE` | `/api/v1/repositories/<id>` | Delete repository and all associated runs |
| `POST` | `/api/v1/repositories/<id>/analyses` | Launch background analysis run |
| `GET` | `/api/v1/analyses/<id>/status` | Poll real-time progress and current stage |
| `POST` | `/api/v1/analyses/<id>/cancel` | Cancel running analysis |
| `GET` | `/api/v1/analyses/<id>/summary` | Aggregated metrics for Overview Dashboard |
| `GET` | `/api/v1/analyses/<id>/interfaces` | Search, filter, and sort interface inventory |
| `GET` | `/api/v1/analyses/<id>/interfaces/<iid>` | Forensic details, CK metrics, ISP stubs, AI plan |
| `GET` | `/api/v1/analyses/<id>/interfaces/<iid>/history`| Snapshot time-series for interface |
| `GET` | `/api/v1/analyses/<id>/dependencies` | Graph nodes and edges for React Flow |
| `GET` | `/api/v1/analyses/<id>/dependencies/cycles` | Detected cyclic dependencies |
| `GET` | `/api/v1/analyses/<id>/change-points` | Detected CUSUM change points |
| `POST` | `/api/v1/analyses/<id>/reports/pdf` | Compile publication PDF report |
| `GET` | `/api/v1/reports/<id>/download` | Download compiled PDF |
| `GET` | `/api/v1/analyses/<id>/evaluation` | Ground-truth benchmark scores |

---

## Testing & Verification

All 43 backend tests can be run at any time:

```powershell
$env:PYTHONPATH="backend"
python -m pytest backend/tests
```

Frontend production verification:

```powershell
cd frontend
npm.cmd run build
```

---

## Known Limitations & Boundaries
- **Static Analysis Scope:** Dynamic runtime reflection, dependency injection frameworks (e.g. Spring runtime proxies), and bytecode manipulation are out of scope.
- **Statistical Change Points:** Detected change points highlight points of sudden score deterioration; they indicate potential erosion events but do not prove architectural intent.
- **Local Git History:** Remote repositories are cloned locally with shallow or configurable commit sampling (default 50 commits) to accommodate standard laptops with 8 GB RAM.
