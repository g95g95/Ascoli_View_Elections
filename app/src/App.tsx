import { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { LandingPage } from './features/landing/LandingPage';
import { Dashboard } from './features/dashboard/Dashboard';
import { MayoralView } from './features/mayoral/MayoralView';
import { PreferencesView } from './features/preferences/PreferencesView';
import { ListeView } from './features/preferences/ListeView';
import { SectionsView } from './features/sections/SectionsView';
import { PresidenteView } from './features/regionali/PresidenteView';
import { ListeRegionaliView } from './features/regionali/ListeRegionaliView';
import { NominaliView } from './features/politiche/NominaliView';
import { ElectionChatbot } from './components/chat';
import { loadElectionData, loadElectionArchive, type ElectionData, type ElectionArchive } from './lib/dataLoader';
import type { ViewType, ElectionConfig } from './types/elections';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('landing');
  const [electionConfig, setElectionConfig] = useState<ElectionConfig | null>(null);
  const [electionData, setElectionData] = useState<ElectionData | null>(null);
  const [archive, setArchive] = useState<ElectionArchive | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load archive in background on mount
  useEffect(() => {
    loadElectionArchive()
      .then(setArchive)
      .catch(err => console.warn('Failed to load archive:', err));
  }, []);

  const handleSelectElection = async (config: ElectionConfig) => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadElectionData(config);
      setElectionData(data);
      setElectionConfig(config);
      setCurrentView('dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore di caricamento');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLanding = () => {
    setElectionConfig(null);
    setElectionData(null);
    setCurrentView('landing');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento dati elettorali...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Errore di caricamento</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleBackToLanding}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Torna alla selezione
          </button>
        </div>
      </div>
    );
  }

  if (currentView === 'landing' || !electionConfig || !electionData) {
    return (
      <>
        <LandingPage onSelectElection={handleSelectElection} />
        {archive && <ElectionChatbot archive={archive} />}
      </>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard electionData={electionData} />;
      case 'ballottaggio':
        if (electionData.ballottaggio) {
          return <MayoralView data={electionData.ballottaggio} title="Ballottaggio Sindaco" />;
        }
        return <Dashboard electionData={electionData} />;
      case 'primo-turno':
        if (electionData.primoTurno) {
          return <MayoralView data={electionData.primoTurno} title="Primo Turno Sindaco" />;
        }
        return <Dashboard electionData={electionData} />;
      case 'presidente':
        if (electionData.coalizioni) {
          return <PresidenteView data={electionData.coalizioni} title={`Presidente ${electionConfig.label}`} />;
        }
        return <Dashboard electionData={electionData} />;
      case 'liste':
        if (electionConfig.type === 'regionali' && electionData.coalizioni) {
          return <ListeRegionaliView data={electionData.coalizioni} title={`Liste ${electionConfig.label}`} />;
        }
        if (electionData.liste) {
          return <ListeView data={electionData.liste} title={`Liste ${electionConfig.label}`} />;
        }
        return <Dashboard electionData={electionData} />;
      case 'preferenze':
        if (electionData.preferenze) {
          return <PreferencesView data={electionData.preferenze} title={`Preferenze ${electionConfig.label}`} />;
        }
        return <Dashboard electionData={electionData} />;
      case 'nominali':
        if (electionData.nominali) {
          return <NominaliView data={electionData.nominali} title={`Uninominale ${electionConfig.label}`} />;
        }
        return <Dashboard electionData={electionData} />;
      case 'sezioni':
        return <SectionsView electionData={electionData} />;
      default:
        return <Dashboard electionData={electionData} />;
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar
        currentView={currentView}
        electionConfig={electionConfig}
        onViewChange={setCurrentView}
        onBackToLanding={handleBackToLanding}
      />
      <main className="flex-1 lg:ml-0 overflow-auto">
        {renderView()}
      </main>
      {archive ? (
        <ElectionChatbot archive={archive} />
      ) : electionData ? (
        <ElectionChatbot electionData={electionData} />
      ) : null}
    </div>
  );
}

export default App;
