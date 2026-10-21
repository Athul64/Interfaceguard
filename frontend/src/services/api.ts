import {
  Repository, AnalysisRun, InterfaceItem, Finding, DependencyNode,
  DependencyEdge, ChangePoint, ReportJob, EvaluationBenchmark, SummaryData
} from '../types';

const BASE_URL = '/api/v1';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errorMsg = `Request failed with status ${res.status}`;
    try {
      const errData = await res.json();
      if (errData && errData.error) errorMsg = errData.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

// ── Health Check ──
export async function fetchHealth() {
  return request<{ status: string; service: string; database: string }>('/health');
}

// ── Repositories ──
export async function fetchRepositories(): Promise<Repository[]> {
  return request<Repository[]>('/repositories');
}

export async function submitRepository(githubUrl: string, branch = 'main', config = {}): Promise<Repository> {
  return request<Repository>('/repositories', {
    method: 'POST',
    body: JSON.stringify({ github_url: githubUrl, branch, config }),
  });
}

export async function fetchRepository(repoId: number): Promise<Repository & { runs: AnalysisRun[]; interfaces_count: number }> {
  return request<Repository & { runs: AnalysisRun[]; interfaces_count: number }>(`/repositories/${repoId}`);
}

export async function deleteRepository(repoId: number): Promise<{ message: string }> {
  return request<{ message: string }>(`/repositories/${repoId}`, {
    method: 'DELETE',
  });
}

// ── Analyses ──
export async function startAnalysis(
  repoId: number,
  options?: { max_commits?: number; branch?: string; scope?: string }
): Promise<AnalysisRun> {
  return request<AnalysisRun>(`/repositories/${repoId}/analyses`, {
    method: 'POST',
    body: JSON.stringify(options || {}),
  });
}

export async function fetchAnalysisRun(runId: number): Promise<AnalysisRun> {
  return request<AnalysisRun>(`/analyses/${runId}`);
}

export async function fetchAnalysisStatus(runId: number): Promise<AnalysisRun> {
  return request<AnalysisRun>(`/analyses/${runId}/status`);
}

export async function cancelAnalysis(runId: number): Promise<{ message: string }> {
  return request<{ message: string }>(`/analyses/${runId}/cancel`, {
    method: 'POST',
  });
}

export async function fetchAnalysisSummary(runId: number): Promise<SummaryData> {
  return request<SummaryData>(`/analyses/${runId}/summary`);
}

// ── Interfaces ──
export async function fetchInterfaces(
  runId: number,
  params?: { search?: string; severity?: string; trend?: string; package?: string; sort_by?: string; order?: string }
): Promise<{ interfaces: InterfaceItem[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.severity) query.set('severity', params.severity);
  if (params?.trend) query.set('trend', params.trend);
  if (params?.package) query.set('package', params.package);
  if (params?.sort_by) query.set('sort_by', params.sort_by);
  if (params?.order) query.set('order', params.order);

  const qs = query.toString();
  return request<{ interfaces: InterfaceItem[]; total: number }>(`/analyses/${runId}/interfaces${qs ? `?${qs}` : ''}`);
}

export async function fetchInterfaceDetail(runId: number, interfaceId: number | string) {
  return request<any>(`/analyses/${runId}/interfaces/${interfaceId}`);
}

export async function fetchInterfaceHistory(runId: number, interfaceId: number | string) {
  return request<any[]>(`/analyses/${runId}/interfaces/${interfaceId}/history`);
}

export async function requestInterfaceExplanation(runId: number, interfaceId: number | string) {
  return request<any>(`/analyses/${runId}/interfaces/${interfaceId}/explain`, {
    method: 'POST',
  });
}

// ── Dependencies ──
export async function fetchDependencies(runId: number): Promise<{ nodes: DependencyNode[]; edges: DependencyEdge[] }> {
  return request<{ nodes: DependencyNode[]; edges: DependencyEdge[] }>(`/analyses/${runId}/dependencies`);
}

export async function fetchDependencyCycles(runId: number): Promise<DependencyEdge[]> {
  return request<DependencyEdge[]>(`/analyses/${runId}/dependencies/cycles`);
}

// ── Findings & Change Points ──
export async function fetchFindings(runId: number, filters?: { category?: string; severity?: string }): Promise<Finding[]> {
  const query = new URLSearchParams();
  if (filters?.category) query.set('category', filters.category);
  if (filters?.severity) query.set('severity', filters.severity);
  const qs = query.toString();
  return request<Finding[]>(`/analyses/${runId}/findings${qs ? `?${qs}` : ''}`);
}

export async function fetchChangePoints(runId: number): Promise<ChangePoint[]> {
  return request<ChangePoint[]>(`/analyses/${runId}/change-points`);
}

export async function fetchHistory(runId: number) {
  return request<any[]>(`/analyses/${runId}/history`);
}

// ── Reports ──
export async function requestPdfReport(runId: number): Promise<ReportJob> {
  return request<ReportJob>(`/analyses/${runId}/reports/pdf`, {
    method: 'POST',
  });
}

export async function fetchReportStatus(reportId: number): Promise<ReportJob> {
  return request<ReportJob>(`/reports/${reportId}`);
}

export function getReportDownloadUrl(reportId: number): string {
  return `${BASE_URL}/reports/${reportId}/download`;
}

// ── Evaluation ──
export async function fetchEvaluation(runId: number): Promise<EvaluationBenchmark[]> {
  return request<EvaluationBenchmark[]>(`/analyses/${runId}/evaluation`);
}
