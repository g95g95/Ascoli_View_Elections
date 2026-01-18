import { useState } from 'react';
import type { ViewType, ElectionConfig } from '../../types/elections';

interface SidebarProps {
  currentView: ViewType;
  electionConfig: ElectionConfig;
  onViewChange: (view: ViewType) => void;
  onBackToLanding: () => void;
}

export function Sidebar({ currentView, electionConfig, onViewChange, onBackToLanding }: SidebarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-800 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>{electionConfig.icon}</span>
          <span className="font-bold">{electionConfig.label}</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 hover:bg-slate-700 rounded-lg"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-slate-800 text-white min-h-screen flex flex-col
          transform transition-transform duration-200 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:transform-none
        `}
      >
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{electionConfig.icon}</span>
            <div>
              <h1 className="text-lg font-bold">{electionConfig.label}</h1>
              <p className="text-xs text-slate-400">Ascoli Piceno</p>
            </div>
          </div>
          <button
            onClick={() => {
              onBackToLanding();
              setMobileMenuOpen(false);
            }}
            className="w-full mt-2 px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center gap-2 transition-colors"
          >
            <span>←</span>
            <span>Cambia elezione</span>
          </button>
        </div>

        <nav className="flex-1 p-2 overflow-y-auto">
          {electionConfig.menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onViewChange(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-lg mb-1 flex items-center gap-3 transition-colors ${
                currentView === item.id
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-slate-700 text-slate-300'
              }`}
            >
              <span>{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700 text-xs text-slate-500">
          52 Sezioni + 1 Consolidata
        </div>
      </aside>

      {/* Spacer for mobile header */}
      <div className="lg:hidden h-16" />
    </>
  );
}
