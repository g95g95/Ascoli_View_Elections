import { useState, useMemo } from 'react';
import { Header } from '../../components/layout/Header';
import { SectionMap } from '../../components/charts/SectionMap';
import type { CoalizioniData } from '../../types/elections';
import { CONSOLIDATED_SECTIONS, CONSOLIDATED_SECTION_ID } from '../../types/elections';

interface PresidenteViewProps {
  data: CoalizioniData;
  title: string;
}

const CANDIDATE_COLORS: Record<string, string> = {
  'Spacca': '#e2001a',
  'Marinelli': '#0066cc',
  'Rossi': '#008000',
  'default': '#3b82f6',
};

export function PresidenteView({ data, title }: PresidenteViewProps) {
  const [selectedCandidate, setSelectedCandidate] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<number | undefined>();

  const sortedCandidates = [...data.coalizioni].sort((a, b) => b.totale - a.totale);
  const totalVotes = sortedCandidates.reduce((sum, c) => sum + c.totale, 0);

  const densityData = useMemo(() => {
    if (!selectedCandidate) return undefined;

    const candidate = data.coalizioni.find(c => c.nome === selectedCandidate);
    if (!candidate) return undefined;

    const result = Object.entries(candidate.sezioni).map(([sectionId, votes]) => {
      const sectionTotal = data.coalizioni.reduce((sum, c) => sum + (c.sezioni[sectionId] || 0), 0);
      return {
        sectionId: parseInt(sectionId),
        value: votes,
        percentage: sectionTotal > 0 ? (votes / sectionTotal) * 100 : 0,
      };
    });

    // Add section 53
    let consolidatedVotes = 0;
    let consolidatedTotal = 0;
    CONSOLIDATED_SECTIONS.forEach(secId => {
      consolidatedVotes += candidate.sezioni[secId.toString()] || 0;
      consolidatedTotal += data.coalizioni.reduce((sum, c) => sum + (c.sezioni[secId.toString()] || 0), 0);
    });

    result.push({
      sectionId: CONSOLIDATED_SECTION_ID,
      value: consolidatedVotes,
      percentage: consolidatedTotal > 0 ? (consolidatedVotes / consolidatedTotal) * 100 : 0,
    });

    return result;
  }, [data.coalizioni, selectedCandidate]);

  const getDensityColor = () => {
    if (!selectedCandidate) return CANDIDATE_COLORS.default;
    const surname = selectedCandidate.split(' ').pop() || '';
    return CANDIDATE_COLORS[surname] || CANDIDATE_COLORS.default;
  };

  const sectionData = useMemo(() => {
    if (!selectedSection) return null;

    if (selectedSection === CONSOLIDATED_SECTION_ID) {
      const voti: Record<string, number> = {};
      data.coalizioni.forEach(c => {
        CONSOLIDATED_SECTIONS.forEach(secId => {
          voti[c.nome] = (voti[c.nome] || 0) + (c.sezioni[secId.toString()] || 0);
        });
      });
      return voti;
    }

    const voti: Record<string, number> = {};
    data.coalizioni.forEach(c => {
      voti[c.nome] = c.sezioni[selectedSection.toString()] || 0;
    });
    return voti;
  }, [selectedSection, data.coalizioni]);

  const selectedCandidatePercentage = useMemo(() => {
    if (!selectedSection || !selectedCandidate || !sectionData) return null;
    const total = Object.values(sectionData).reduce((s, v) => s + v, 0);
    const votes = sectionData[selectedCandidate] || 0;
    return total > 0 ? (votes / total) * 100 : 0;
  }, [selectedSection, selectedCandidate, sectionData]);

  return (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <Header title={title} subtitle={`${data.data} - ${data.coalizioni.length} candidati`} />
      <div className="p-4 md:p-6">
        {/* Density Controls */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <h3 className="text-sm font-semibold mb-3 text-gray-700">Visualizza Densità Voto per Candidato</h3>
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={() => setSelectedCandidate('')}
              className={`px-3 py-1.5 text-xs rounded-full transition-colors ${!selectedCandidate ? 'bg-gray-800 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              Nessuna
            </button>
            {sortedCandidates.map(candidate => (
              <button
                key={candidate.nome}
                onClick={() => setSelectedCandidate(candidate.nome)}
                className={`px-3 py-1.5 text-xs rounded-full transition-colors ${selectedCandidate === candidate.nome ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                {candidate.nome}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 mb-6">
          {/* Map */}
          <SectionMap
            selectedSection={selectedSection}
            onSectionClick={setSelectedSection}
            densityData={densityData}
            densityColor={getDensityColor()}
            showLegend={!!selectedCandidate}
            legendLabel={selectedCandidate}
          />

          {/* Section Detail or Results */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
            {sectionData ? (
              <>
                <h3 className="text-lg font-semibold mb-4">Sezione {selectedSection}</h3>
                {selectedCandidate && selectedCandidatePercentage !== null && (
                  <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="text-sm text-blue-600 font-medium">{selectedCandidate}</div>
                    <div className="text-2xl font-bold text-blue-700">{selectedCandidatePercentage.toFixed(1)}%</div>
                    <div className="text-xs text-blue-500">{sectionData[selectedCandidate] || 0} voti in questa sezione</div>
                  </div>
                )}
                <div className="space-y-3">
                  {Object.entries(sectionData)
                    .sort(([, a], [, b]) => b - a)
                    .map(([name, votes], idx) => {
                      const total = Object.values(sectionData).reduce((s, v) => s + v, 0);
                      const pct = ((votes / total) * 100).toFixed(1);
                      const isSelected = name === selectedCandidate;
                      return (
                        <div key={name} className={`p-2 rounded ${isSelected ? 'bg-blue-50 border border-blue-200' : ''}`}>
                          <div className="flex justify-between mb-1 text-sm">
                            <span className="font-medium truncate flex items-center gap-1">
                              <span className={`w-5 h-5 flex items-center justify-center rounded-full text-xs ${idx < 3 ? 'bg-amber-500 text-white' : 'bg-gray-200'}`}>
                                {idx + 1}
                              </span>
                              <span className="truncate">{name}</span>
                            </span>
                            <span className="ml-2">{votes} ({pct}%)</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-red-500' : 'bg-gray-400'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
                <button
                  onClick={() => setSelectedSection(undefined)}
                  className="mt-4 text-sm text-blue-600 hover:underline"
                >
                  ← Torna ai risultati generali
                </button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-4">Risultati Presidente</h3>
                <div className="space-y-4">
                  {sortedCandidates.map((candidate, idx) => {
                    const pct = ((candidate.totale / totalVotes) * 100).toFixed(1);
                    const isSelected = candidate.nome === selectedCandidate;
                    return (
                      <div
                        key={candidate.nome}
                        className={`cursor-pointer p-3 rounded-lg transition-colors ${isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}`}
                        onClick={() => setSelectedCandidate(candidate.nome)}
                      >
                        <div className="flex justify-between mb-2">
                          <span className="font-semibold flex items-center gap-2">
                            <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs ${idx < 3 ? 'bg-amber-500 text-white' : 'bg-gray-200'}`}>
                              {idx + 1}
                            </span>
                            <span>{candidate.nome}</span>
                          </span>
                          <span className="text-gray-600">
                            {candidate.totale.toLocaleString('it-IT')} ({pct}%)
                          </span>
                        </div>
                        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-red-500' : 'bg-gray-400'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-blue-700">
              {totalVotes.toLocaleString('it-IT')}
            </div>
            <div className="text-sm text-blue-600">Voti Totali</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-green-700">{data.coalizioni.length}</div>
            <div className="text-sm text-green-600">Candidati</div>
          </div>
          <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-lg md:text-xl font-bold text-amber-700 truncate">{sortedCandidates[0]?.nome}</div>
            <div className="text-sm text-amber-600">
              Presidente Eletto - {sortedCandidates[0]?.totale.toLocaleString('it-IT')} voti
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
