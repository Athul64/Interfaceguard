# InterfaceGuard — Architectural Specification & Field Journal

**InterfaceGuard** is an open-source software engineering tool that audits object-oriented interface erosion in Java repositories across Git history.

---

## 1. System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        React 19 Frontend (Vite)                        │
│   Software Architecture Field Journal Design (#2E4036, #CC5833, #F2F0E9)│
│   Overview · Interfaces · Dependencies (React Flow) · History · Reports│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST (/api/v1)
┌───────────────────────────────────▼────────────────────────────────────┐
│                       Flask 3.0.3 Backend Core                         │
│  ┌──────────────────────┐  ┌─────────────────┐  ┌───────────────────┐  │
│  │   Analysis Pipeline  │  │  SQLite Model   │  │ ReportLab PDF Gen │  │
│  └──────────┬───────────┘  └─────────────────┘  └───────────────────┘  │
└─────────────┼──────────────────────────────────────────────────────────┘
              │ Subprocess Bridge
┌─────────────▼──────────────────────────────────────────────────────────┐
│              JavaParser 3.26.2 Static AST Bridge (Java 17+)            │
│  Extracts Interfaces, Methods, Classes, Body Stubs, & Dependencies     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. JavaParser Bridge Architecture

InterfaceGuard uses a dedicated Java command-line bridge (`javaparser-bridge-1.0.jar`) compiled with Maven and shaded with `javaparser-core-3.26.2` and `org.json`.

### Extracted AST Information
1. **Interface Declarations:**
   - Interface name, package, extends clauses.
   - Declared methods, parameter types, return types, start and end source lines.
2. **Implementing Class Declarations:**
   - Implements clauses matching tracked interfaces.
   - Method bodies inspected for Interface Segregation Principle (ISP) violations:
     - Empty implementations (`{}`)
     - No-operation implementations (empty bodies with comments)
     - Exception-throwing stubs (`throw new UnsupportedOperationException()`, `throw new NotImplementedException()`)
     - Placeholder returns (`return null;`, `return 0;`, `return false;`, `new byte[0]`)
3. **Fallback Parser:**
   - In environments where Java runtime is unavailable, InterfaceGuard gracefully activates its documented Python `javalang` fallback parser.

---

## 3. Metrics & Scoring Formulation

### Chidamber & Kemerer (CK) Metrics Aggregation
All CK metrics for an interface are calculated and aggregated across its concrete implementing classes:
- **CBO (Coupling Between Objects):** Distinct external non-primitive types referenced.
- **LCOM (Lack of Cohesion in Methods):** Henderson-Sellers pairwise method parameter disjointness.
- **RFC (Response For a Class):** Declared methods plus invoked external methods.
- **WMC (Weighted Methods per Class):** Sum of method complexities.
- **DIT (Depth of Inheritance Tree):** Class hierarchy depth.
- **NOC (Number of Children):** Count of concrete implementing classes.

### Interface Erosion Metrics
- **Method Growth:** $\Delta = \text{Current Methods} - \text{Initial Methods}$
- **Interface Cohesion:** Ratio of method pairs sharing at least one parameter type.
- **Cumulative Churn:** Number of commits altering interface signatures.
- **Breaking Changes:** Deleted methods or altered parameter/return types.

### Health Score (0–100)
Transparent penalty-based normalization:
$$\text{Penalty} = 0.30 \cdot \text{ISP} + 0.20 \cdot \text{Bloat} + 0.15 \cdot \text{Coupling} + 0.15 \cdot \text{Cycles} + 0.10 \cdot \text{Churn} + 0.10 \cdot \text{Cohesion}$$
$$\text{Health Score} = 100 \cdot (1 - \text{Penalty})$$

- **Healthy:** $\ge 80$
- **Warning:** $60 - 79$
- **High:** $40 - 59$
- **Critical:** $< 40$

---

## 4. Change-Point Detection (CUSUM)

InterfaceGuard inspects historical Health Score trajectories across Git commits using a cumulative sum (CUSUM) change-point detector. A drop $\Delta \ge 10$ points between consecutive commit snapshots triggers an architectural Change Point record.

---

## 5. Report Generation

Reports are exported exclusively in **PDF format** generated via the backend ReportLab engine adhering to the Software Architecture Field Journal design tokens.
