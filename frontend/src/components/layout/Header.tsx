import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GitBranch, 
  ChevronDown, 
  Check, 
  Plus, 
  RefreshCw, 
  FileDown, 
  Menu,
  X,
  Play
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusIndicator } from '../ui/StatusIndicator';
import { Button } from '../ui/Button';

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  const { 
    currentRepo, 
    repositories, 
    selectRepo, 
    currentRun, 
    isAnalyzing, 
    runAnalysis 
  } = useApp();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleReanalyze = async () => {
    if (!currentRepo || isAnalyzing) return;
    try {
      await runAnalysis(currentRepo.repository_id, 10);
    } catch (err) {
      console.error('Failed to trigger analysis:', err);
    }
  };

  const handleDownloadPdf = () => {
    if (!currentRun) {
      navigate('/reports');
      return;
    }
    const token = localStorage.getItem('token');
    const authQuery = token ? `?token=${encodeURIComponent(token)}` : '';
    const url = `/api/v1/reports/pdf?run_id=${currentRun.run_id}${authQuery ? '&' + authQuery.substring(1) : ''}`;
    
    // Create temporary anchor to trigger clean download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `InterfaceGuard_Report_Run_${currentRun.run_id}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <header className="sticky top-0 z-30 h-14 w-full bg-[#FAF9F5] border-b border-[#D4D1C8] px-4 sm:px-6 flex items-center justify-between shadow-xs">
      {/* Left: Mobile Toggle & Page / Repo Identity */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="md:hidden p-1.5 text-charcoal hover:bg-[#F2F0E9] rounded-sm border border-[#D4D1C8]"
          aria-label="Toggle navigation"
        >
          {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

        {/* Repository Switcher Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#FAF9F5] hover:bg-[#F2F0E9] border border-[#D4D1C8] rounded-sm text-xs font-mono text-charcoal transition-colors shadow-xs"
          >
            <GitBranch className="w-3.5 h-3.5 text-[#2E4036]" />
            <span className="font-semibold max-w-[160px] sm:max-w-[220px] truncate">
              {currentRepo ? currentRepo.name : 'Select Repository'}
            </span>
            <ChevronDown className="w-3 h-3 text-muted ml-1" />
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-72 bg-[#FAF9F5] border border-[#D4D1C8] rounded-sm shadow-paper py-1.5 z-50">
              <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-muted border-b border-[#D4D1C8] flex items-center justify-between">
                <span>Repositories ({repositories.length})</span>
                <span className="text-[9px]">SQLite v1</span>
              </div>
              <div className="max-h-64 overflow-y-auto py-1">
                {repositories.map((repo) => (
                  <button
                    key={repo.repository_id}
                    type="button"
                    onClick={() => {
                      selectRepo(repo);
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 flex items-center justify-between text-xs hover:bg-[#F2F0E9] transition-colors"
                  >
                    <div className="truncate">
                      <div className="font-semibold text-charcoal truncate">{repo.name}</div>
                      <div className="font-mono text-[10px] text-muted truncate">
                        {repo.default_branch || 'main'} &bull; ID: {repo.repository_id}
                      </div>
                    </div>
                    {currentRepo?.repository_id === repo.repository_id && (
                      <Check className="w-4 h-4 text-[#2E4036] shrink-0 ml-2" />
                    )}
                  </button>
                ))}
              </div>
              <div className="border-t border-[#D4D1C8] pt-1 mt-1 px-2">
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/import');
                  }}
                  className="w-full text-center py-1.5 text-xs font-sans font-semibold text-[#2E4036] hover:bg-[#DFE5DF] rounded-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Import Another Repository</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Status Indicator */}
        <div className="hidden sm:block">
          <StatusIndicator
            status={isAnalyzing ? 'Running' : currentRun ? 'Completed' : 'Queued'}
            metadata={currentRun ? `Run #${currentRun.run_id}` : undefined}
            size="sm"
          />
        </div>
      </div>

      {/* Right: Primary Context Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Audit / Re-Analyze Button */}
        {currentRepo && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleReanalyze}
            isLoading={isAnalyzing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 text-[#2E4036] ${isAnalyzing ? 'animate-spin' : ''}`} />}
            className="hidden sm:inline-flex"
            title="Re-run analysis across recent commits"
          >
            Audit Commits
          </Button>
        )}

        {/* Download PDF Field Journal */}
        <Button
          variant="primary"
          size="sm"
          onClick={handleDownloadPdf}
          leftIcon={<FileDown className="w-3.5 h-3.5" />}
          title="Download Field Journal PDF report"
        >
          Export PDF
        </Button>
      </div>
    </header>
  );
};
