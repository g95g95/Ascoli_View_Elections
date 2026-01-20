import { useState, useMemo } from 'react';
import { Header } from '../../components/layout/Header';
import { SectionMap } from '../../components/charts/SectionMap';
import type { NominaliElection } from '../../types/elections';

interface NominaliViewProps {
  data: NominaliElection;
  title: string;
}

const CANDIDATE_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

export function NominaliView({ data, title }: NominaliViewProps) {
  const [selectedSection, setSelectedSection] = useState<number | undefined>();
  const [selectedCandidate, setSelectedCandidate] = useState<string>('');

  const totalVotes = data.candidati.reduce((sum, c) => sum + c.totale, 0);
  const winner = data.candidati.reduce((a, b) => (a.totale > b.totale ? a : b));

  const allSectionIds = useMemo(() => {
    if (data.candidati[0]?.sezioni) {
      return Object.keys(data.candidati[0].sezioni).map(Number).sort((a, b) => a - b);
    }
    return [];
  }, [data]);

  const densityData = useMemo(() => {
    if (!selectedCandidate) return undefined;

    const candidate = data.candidati.find(c => c.nome === selectedCandidate);
    if (!candidate?.sezioni) return undefined;

    return allSectionIds.map(sectionId => {
      const value = candidate.sezioni[sectionId.toString()] || 0;
      const total = data.candidati.reduce((s, c) => s + (c.sezioni[sectionId.toString()] || 0), 0);
      return {
        sectionId,
        value,
        percentage: total > 0 ? (value / total) * 100 : 0,
      };
    });
  }, [data, selectedCandidate, allSectionIds]);

  const getCandidateColor = (index: number) => CANDIDATE_COLORS[index % CANDIDATE_COLORS.length];

  const getDensityColor = () => {
    if (!selectedCandidate) return '#3b82f6';
    const idx = data.candidati.findIndex(c => c.nome === selectedCandidate);
    return getCandidateColor(idx);
  };

  return (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <Header title={title} subtitle={`${data.data} - ${data.comune}${data.collegio ? ` - ${data.collegio}` : ''}`} />
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
          {data.candidati.slice(0, 8).map((candidate, idx) => {
            const percentage = ((candidate.totale / totalVotes) * 100).toFixed(1);
            const isWinner = candidate.nome === winner.nome;
            return (
              <div
                key={candidate.nome}
                className={`p-4 rounded-xl border-2 ${
                  isWinner ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm md:text-base font-bold truncate">{candidate.nome}</span>
                  {isWinner && <span className="text-lg">🏆</span>}
                </div>
                <div className="mt-2 text-xl md:text-2xl font-bold">
                  {candidate.totale.toLocaleString('it-IT')}
                </div>
                <div className="mt-1 text-gray-600 text-sm">{percentage}% dei voti</div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full"
                    style={{ width: `${percentage}%`, backgroundColor: getCandidateColor(idx) }}
                  />
                </div>
              </div>
            );
          })}
          <div className="p-4 rounded-xl border border-gray-200 bg-white">
            <div className="text-sm md:text-base font-medium text-gray-600">Voti Totali</div>
            <div className="mt-2 text-xl md:text-2xl font-bold">
              {totalVotes.toLocaleString('it-IT')}
            </div>
            <div className="mt-1 text-xs md:text-sm text-gray-500">
              {allSectionIds.length} sezioni
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <h3 className="text-sm font-semibold mb-3 text-gray-700">Visualizza Densita Voto</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCandidate('')}
              className={`px-3 py-1.5 text-xs rounded-full transition-colors ${!selectedCandidate ? 'bg-gray-800 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              Nessuna
            </button>
            {data.candidati.slice(0, 5).map((c, idx) => (
              <button
                key={c.nome}
                onClick={() => setSelectedCandidate(c.nome)}
                className="px-3 py-1.5 text-xs rounded-full transition-colors"
                style={{
                  backgroundColor: selectedCandidate === c.nome ? getCandidateColor(idx) : '#f3f4f6',
                  color: selectedCandidate === c.nome ? 'white' : 'inherit'
                }}
              >
                {c.nome.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <SectionMap
            selectedSection={selectedSection}
            onSectionClick={setSelectedSection}
            densityData={densityData}
            densityColor={getDensityColor()}
            showLegend={!!selectedCandidate}
            legendLabel={selectedCandidate}
          />

          <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
            <h3 className="text-lg font-semibold mb-4">
              {selectedSection ? `Dettaglio Sezione ${selectedSection}` : 'Risultati per Sezione'}
            </h3>
            {selectedSection ? (
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg text-center mb-4">
                  <div className="text-sm text-gray-600">Voti Totali Sezione</div>
                  <div className="text-xl font-bold">
                    {data.candidati.reduce((s, c) => s + (c.sezioni[selectedSection.toString()] || 0), 0)}
                  </div>
                </div>
                {data.candidati.map((candidate, idx) => {
                  const votes = candidate.sezioni[selectedSection.toString()] || 0;
                  const sectionTotal = data.candidati.reduce((s, c) => s + (c.sezioni[selectedSection.toString()] || 0), 0);
                  const pct = sectionTotal > 0 ? ((votes / sectionTotal) * 100).toFixed(1) : '0';
                  return (
                    <div key={candidate.nome}>
                      <div className="flex justify-between mb-1 text-sm">
                        <span className="font-medium truncate mr-2">{candidate.nome}</span>
                        <span className="whitespace-nowrap">
                          {votes} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full"
                          style={{ width: `${pct}%`, backgroundColor: getCandidateColor(idx) }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b">
                      <th className="text-left py-2">Sez.</th>
                      {data.candidati.slice(0, 4).map((c) => (
                        <th key={c.nome} className="text-right py-2 text-xs">
                          {c.nome.split(' ')[0]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allSectionIds.map((sectionId) => {
                      const votes = data.candidati.slice(0, 4).map(c => c.sezioni[sectionId.toString()] || 0);
                      const maxVotes = Math.max(...votes);
                      return (
                        <tr
                          key={sectionId}
                          className="border-b hover:bg-gray-50 cursor-pointer"
                          onClick={() => setSelectedSection(sectionId)}
                        >
                          <td className="py-2 font-medium">{sectionId}</td>
                          {data.candidati.slice(0, 4).map((c, idx) => {
                            const v = c.sezioni[sectionId.toString()] || 0;
                            return (
                              <td
                                key={c.nome}
                                className="text-right py-2"
                                style={{
                                  color: v === maxVotes && v > 0 ? getCandidateColor(idx) : 'inherit',
                                  fontWeight: v === maxVotes && v > 0 ? 'bold' : 'normal'
                                }}
                              >
                                {v}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
