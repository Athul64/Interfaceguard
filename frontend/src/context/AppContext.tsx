import React, { createContext, useContext, useState, useEffect } from 'react';
import { Repository, AnalysisRun } from '../types';
import { fetchRepositories, fetchAnalysisRun, fetchAnalysisStatus } from '../services/api';

interface AppContextType {
  repositories: Repository[];
  currentRepo: Repository | null;
  currentRun: AnalysisRun | null;
  activeRunId: number | null;
  isAnalyzing: boolean;
  activeRunStatus: AnalysisRun | null;
  selectRepo: (repo: Repository) => void;
  selectRun: (run: AnalysisRun) => void;
  refreshRepositories: () => Promise<void>;
  startTrackingRun: (runId: number) => void;
  stopTrackingRun: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [currentRepo, setCurrentRepo] = useState<Repository | null>(null);
  const [currentRun, setCurrentRun] = useState<AnalysisRun | null>(null);
  const [activeRunId, setActiveRunId] = useState<number | null>(null);
  const [activeRunStatus, setActiveRunStatus] = useState<AnalysisRun | null>(null);

  const refreshRepositories = async () => {
    try {
      const repos = await fetchRepositories();
      setRepositories(repos);
      if (repos.length > 0 && !currentRepo) {
        setCurrentRepo(repos[0]);
        if (repos[0].latest_run) {
          setCurrentRun(repos[0].latest_run);
        }
      }
    } catch (err) {
      console.error('Failed to load repositories', err);
    }
  };

  useEffect(() => {
    refreshRepositories();
  }, []);

  // Poll active run if running
  useEffect(() => {
    if (!activeRunId) return;

    const interval = setInterval(async () => {
      try {
        const status = await fetchAnalysisStatus(activeRunId);
        setActiveRunStatus(status);
        if (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled') {
          clearInterval(interval);
          setActiveRunId(null);
          setCurrentRun(status);
          refreshRepositories();
        }
      } catch (err) {
        console.error('Error polling status', err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [activeRunId]);

  const selectRepo = (repo: Repository) => {
    setCurrentRepo(repo);
    if (repo.latest_run) {
      setCurrentRun(repo.latest_run);
    } else {
      setCurrentRun(null);
    }
  };

  const selectRun = (run: AnalysisRun) => {
    setCurrentRun(run);
  };

  const startTrackingRun = (runId: number) => {
    setActiveRunId(runId);
  };

  const stopTrackingRun = () => {
    setActiveRunId(null);
  };

  return (
    <AppContext.Provider
      value={{
        repositories,
        currentRepo,
        currentRun,
        activeRunId,
        isAnalyzing: Boolean(activeRunId),
        activeRunStatus,
        selectRepo,
        selectRun,
        refreshRepositories,
        startTrackingRun,
        stopTrackingRun,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
