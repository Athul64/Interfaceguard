import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Activity, 
  Layers, 
  GitFork, 
  GitBranch, 
  FileText, 
  Settings,
  Plus, 
  Cpu
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentRepo, repositories, selectRepo, isAnalyzing, currentRun } = useApp();
  const location = useLocation();

  const navigation = [
    { name: 'Overview', path: '/overview', icon: Activity },
    { name: 'Interfaces', path: '/interfaces', icon: Layers },
    { name: 'Dependencies', path: '/dependencies', icon: GitFork },
    { name: 'History', path: '/history', icon: GitBranch },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside
      style={{ backgroundColor: '#213129' }}
      className={`fixed top-0 bottom-0 left-0 z-40 w-[220px] bg-forest-deep text-[#F2F0E9] border-r border-[#2E4036] flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Top Section */}
      <div>
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-white/10 flex items-center justify-between bg-[#1b2821]">
          <NavLink
            to="/overview"
            onClick={onClose}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-sm bg-[#CC5833] text-[#F2F0E9] flex items-center justify-center font-heading font-extrabold text-sm shadow-sm shrink-0">
              IG
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-bold text-sm tracking-tight text-[#F2F0E9] leading-tight">
                Interface<span className="text-[#CC5833]">Guard</span>
              </span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#F2F0E9]/60">
                Arch Field Journal
              </span>
            </div>
          </NavLink>
        </div>

        {/* Active Repository Card */}
        <div className="px-3.5 py-3 border-b border-white/10 bg-[#18251f]">
          <div className="text-[9.5px] font-mono uppercase tracking-wider text-[#F2F0E9]/50 mb-1 flex items-center justify-between">
            <span>Target Repository</span>
            {currentRepo && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#DFE5DF]" />
            )}
          </div>
          {currentRepo ? (
            <div className="truncate">
              <div className="font-heading font-semibold text-xs text-[#F2F0E9] truncate" title={currentRepo.name}>
                {currentRepo.name}
              </div>
              <div className="font-mono text-[10px] text-[#DFE5DF]/70 flex items-center gap-1.5 mt-0.5">
                <GitBranch className="w-3 h-3 text-[#CC5833] shrink-0" />
                <span className="truncate">{currentRepo.default_branch || 'main'}</span>
              </div>
            </div>
          ) : (
            <div className="font-mono text-[11px] text-[#F2F0E9]/50 italic">
              No repository selected
            </div>
          )}
        </div>

        {/* Main Navigation Links */}
        <nav className="py-3 px-2 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`group flex items-center gap-3 px-3 py-2 text-xs font-sans rounded-sm transition-all relative ${
                  isActive
                    ? 'bg-[#2E4036] text-[#FFFFFF] font-semibold shadow-xs'
                    : 'text-[#DFE5DF]/80 hover:text-[#FFFFFF] hover:bg-[#2E4036]/50'
                }`}
              >
                {/* 2px Solid Clay Active Indicator */}
                {isActive && (
                  <span className="absolute right-0 top-0 bottom-0 w-[3px] bg-[#CC5833]" />
                )}
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-[#CC5833]' : 'text-[#DFE5DF]/60 group-hover:text-[#FFFFFF]'
                  }`}
                />
                <span className="truncate tracking-tight">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Analysis Status & Quick Actions */}
      <div className="p-3 border-t border-white/10 space-y-2.5 bg-[#1b2821]">
        {currentRun && (
          <NavLink
            to={`/analysis?run_id=${currentRun.run_id}`}
            onClick={onClose}
            className="block bg-[#18251f] p-2.5 rounded-sm border border-white/10 hover:border-white/30 transition-colors group"
            title="View complete forensic analysis audit trace"
          >
            <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-wider text-[#F2F0E9]/60 mb-1">
              <span>Erosion Index</span>
              <span className="font-bold text-[#F2F0E9]">#{currentRun.run_id} &rarr;</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-heading font-extrabold text-lg text-[#F2F0E9]">
                {currentRun.project_erosion_index.toFixed(1)}
              </span>
              <span className="font-mono text-[10px] text-[#F2DED6]">
                {currentRun.total_interfaces} ifaces
              </span>
            </div>
          </NavLink>
        )}

        <NavLink
          to="/import"
          onClick={onClose}
          className="flex items-center justify-center gap-1.5 w-full py-2 px-3 bg-[#CC5833] hover:bg-[#b84a28] text-[#FFFFFF] text-xs font-heading font-semibold rounded-sm shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Repository</span>
        </NavLink>

        <div className="pt-0.5 text-center font-mono text-[9px] text-[#F2F0E9]/40">
          JavaParser 3.26.2 &bull; PyDriller
        </div>
      </div>
    </aside>
  );
};
