export interface Repository {
  repository_id: number;
  github_url: string;
  name: string;
  default_branch?: string;
  is_demo?: boolean;
  analyzed_at: string;
  latest_run?: AnalysisRun | null;
  interface_count?: number;
}

export interface AnalysisRun {
  run_id: number;
  repository_id: number;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  stage: string;
  progress_percent: number;
  current_commit?: string;
  total_commits: number;
  processed_commits: number;
  extracted_interfaces: number;
  project_erosion_index: number;
  error_message?: string;
  warnings?: string;
  scope?: string;
  branch?: string;
  created_at: string;
  completed_at?: string;
}

export interface InterfaceSnapshot {
  snapshot_id: number;
  interface_id: number;
  commit_id: number;
  analysis_run_id?: number;
  method_count: number;
  isp_violation_ratio: number;
  dependency_count: number;
  churn: number;
  breaking_change_count: number;
  health_score: number;
  is_eroding: boolean;
  cbo: number;
  lcom: number;
  rfc: number;
  wmc: number;
  dit: number;
  noc: number;
  method_growth: number;
  cohesion: number;
  severity: 'healthy' | 'warning' | 'high' | 'critical';
  trend: 'stable' | 'rising' | 'accelerating';
  isp_violations_count: number;
  smells_count: number;
}

export interface InterfaceItem {
  interface_id: number;
  repository_id?: number;
  name: string;
  package: string;
  file_path: string;
  findings_count: number;
  has_change_point: boolean;
  change_point?: ChangePoint;
  latest_snapshot?: InterfaceSnapshot;
  health_score?: number;
  severity?: 'healthy' | 'warning' | 'high' | 'critical' | 'low' | 'medium';
  trend?: 'stable' | 'rising' | 'accelerating' | 'insufficient';
  method_count?: number;
  isp_violations_count?: number;
  smells_count?: number;
}

export interface Finding {
  finding_id: number;
  analysis_run_id: number;
  interface_id?: number;
  snapshot_id?: number;
  category: 'isp_violation' | 'code_smell' | 'dependency_cycle' | 'fat_interface' | string;
  rule_name: string;
  severity: 'critical' | 'high' | 'warning' | 'healthy';
  description: string;
  evidence?: string;
  class_name?: string;
  method_name?: string;
  file_path?: string;
  line_number?: number;
}

export interface DependencyNode {
  id: string;
  label: string;
  type: 'interface' | 'class';
  package?: string;
  file_path?: string;
  in_degree?: number;
  out_degree?: number;
  in_cycle: boolean;
}

export interface DependencyEdge {
  id?: string;
  edge_id?: number;
  analysis_run_id?: number;
  source: string;
  target: string;
  source_name?: string;
  target_name?: string;
  relationship: 'implements' | 'depends_on' | 'extends';
  in_cycle: boolean;
  cycle_path?: string;
}

export interface ChangePoint {
  change_point_id: number;
  analysis_run_id: number;
  interface_id?: number;
  commit_hash: string;
  commit_date?: string;
  author?: string;
  metric_name: string;
  score_before?: number;
  score_after?: number;
  confidence: number;
  description: string;
  is_project_level?: boolean;
}

export interface Explanation {
  explanation_id: number;
  snapshot_id: number;
  interface_id?: number;
  explanation_text: string;
  suggestion_text?: string;
  impact_text?: string;
  refactoring_recommendation?: string;
  responsibility_separation?: string;
  risk_analysis?: string;
  is_ai_generated: boolean;
  provider: string;
  generated_at: string;
}

export interface ReportJob {
  report_id: number;
  analysis_run_id: number;
  status: 'generating' | 'completed' | 'failed';
  file_size: number;
  scope: string;
  error_message?: string;
  created_at: string;
}

export interface EvaluationBenchmark {
  id: number;
  repository_name: string;
  configuration: string;
  total_interfaces: number;
  true_positives: number;
  false_positives: number;
  false_negatives: number;
  true_negatives: number;
  precision: number;
  recall: number;
  f1_score: number;
  details?: string;
  evaluated_at?: string;
}

export interface SummaryData {
  run_id: number;
  repository: Repository;
  project_erosion_index: number;
  processed_commits: number;
  total_interfaces: number;
  health_distribution: {
    healthy: number;
    warning: number;
    high: number;
    critical: number;
  };
  trend_distribution: {
    stable: number;
    rising: number;
    accelerating: number;
  };
  findings_by_category: Record<string, number>;
  cycles_count: number;
  change_points_count: number;
  most_eroded_interfaces: Array<{
    interface_id: number;
    name: string;
    package: string;
    health_score: number;
    severity: string;
    trend: string;
    method_count: number;
    isp_violations_count: number;
    smells_count: number;
  }>;
  history_trend: Array<{
    commit_hash: string;
    commit_date: string;
    project_erosion_index: number;
    interface_count: number;
  }>;
}
