import { getElectionsByYear } from '../../config/elections';
import type { ElectionConfig } from '../../types/elections';

interface LandingPageProps {
  onSelectElection: (config: ElectionConfig) => void;
}

export function LandingPage({ onSelectElection }: LandingPageProps) {
  const electionsByYear = getElectionsByYear();
  const years = [...electionsByYear.keys()].sort((a, b) => b - a);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col">
      <header className="p-6 md:p-8 text-center">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">
          Elezioni Ascoli Piceno
        </h1>
        <p className="text-blue-200 text-lg">Visualizzazione dati elettorali</p>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          {years.map((year) => (
            <div key={year} className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4 text-center">
                {year}
              </h2>
              <div className={`grid grid-cols-1 gap-4 md:gap-6 ${
                (electionsByYear.get(year)?.length || 0) === 1
                  ? 'md:grid-cols-1 max-w-md mx-auto'
                  : 'md:grid-cols-2'
              }`}>
                {electionsByYear.get(year)?.map((config) => (
                  <button
                    key={config.id}
                    onClick={() => onSelectElection(config)}
                    className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 md:p-8 text-left hover:bg-white/20 transition-all hover:scale-105 hover:shadow-2xl group"
                  >
                    <div className="text-4xl md:text-5xl mb-4">{config.icon}</div>
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                      {config.label}
                    </h3>
                    <p className="text-blue-200 text-sm md:text-base">
                      {config.description}
                    </p>
                    <div className="mt-4 text-blue-400 group-hover:text-blue-300 text-sm font-medium flex items-center gap-2">
                      Visualizza risultati
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="p-6 text-center text-blue-300/60 text-sm">
        Comune di Ascoli Piceno · 52 Sezioni Elettorali
      </footer>
    </div>
  );
}
