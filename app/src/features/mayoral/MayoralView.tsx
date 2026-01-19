import { useState, useMemo } from 'react';
import { Header } from '../../components/layout/Header';
import { SectionMap } from '../../components/charts/SectionMap';
import type { MayoralElection } from '../../types/elections';

interface MayoralViewProps {
  data: MayoralElection;
  title: string;
}

export function MayoralView({ data, title }: MayoralViewProps) {
  const [selectedSection, setSelectedSection] = useState<number | undefined>();
  const [selectedCandidate, setSelectedCandidate] = useState<string>('');

  const totalVotes = data.candidati.reduce((sum, c) => sum + c.totale, 0);
  const winner = data.candidati.reduce((a, b) => (a.totale > b.totale ? a : b));

  const hasLegacySezioni = !!data.sezioni;
  const hasAffluenza = !!data.affluenza;
  const hasCandidateSezioni = !!data.candidati[0]?.sezioni;

  const sectionData = selectedSection && hasLegacySezioni ? data.sezioni![selectedSection.toString()] : null;

  const allSectionIds = useMemo(() => {
    if (hasLegacySezioni) {
      return Object.keys(data.sezioni!).map(Number).sort((a, b) => a - b);
    }
    if (hasCandidateSezioni) {
      return Object.keys(data.candidati[0].sezioni!).map(Number).sort((a, b) => a - b);
    }
    return [];
  }, [data, hasLegacySezioni, hasCandidateSezioni]);

  const densityData = useMemo(() => {
    if (!selectedCandidate) return undefined;

    if (hasLegacySezioni) {
      return Object.entries(data.sezioni!).map(([sectionId, section]) => {
        const total = Object.values(section.voti).reduce((s, v) => s + v, 0);
        const value = section.voti[selectedCandidate] || 0;
        return {
          sectionId: parseInt(sectionId),
          value,
          percentage: total > 0 ? (value / total) * 100 : 0,
        };
      });
    }

    if (hasCandidateSezioni) {
      const candidate = data.candidati.find(c => c.nome === selectedCandidate);
      if (!candidate?.sezioni) return undefined;
      return allSectionIds.map(sectionId => {
        const value = candidate.sezioni![sectionId.toString()] || 0;
        const total = data.candidati.reduce((s, c) => s + (c.sezioni?.[sectionId.toString()] || 0), 0);
        return {
          sectionId,
          value,
          percentage: total > 0 ? (value / total) * 100 : 0,
        };
      });
    }

    return undefined;
  }, [data, selectedCandidate, hasLegacySezioni, hasCandidateSezioni, allSectionIds]);

  const getDensityColor = () => {
    if (!selectedCandidate) return '#3b82f6';
    const idx = data.candidati.findIndex(c => c.nome === selectedCandidate);
    return idx === 0 ? '#3b82f6' : '#ef4444';
  };

  return (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <Header title={title} subtitle={`${data.data} - ${data.comune}`} />
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {data.candidati.map((candidate, idx) => {
            const percentage = ((candidate.totale / totalVotes) * 100).toFixed(1);
            const isWinner = candidate.nome === winner.nome;
            return (
              <div
                key={candidate.nome}
                className={`p-4 md:p-6 rounded-xl border-2 ${
                  isWinner ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base md:text-lg font-bold">{candidate.nome}</span>
                  {isWinner && <span className="text-xl md:text-2xl">👑</span>}
                </div>
                <div className="mt-2 text-2xl md:text-3xl font-bold">
                  {candidate.totale.toLocaleString('it-IT')}
                </div>
                <div className="mt-1 text-gray-600 text-sm">{percentage}% dei voti</div>
                <div className="mt-3 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${idx === 0 ? 'bg-blue-500' : 'bg-red-500'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
          {hasAffluenza ? (
            <div className="p-4 md:p-6 rounded-xl border border-gray-200 bg-white">
              <div className="text-base md:text-lg font-medium text-gray-600">Affluenza</div>
              <div className="mt-2 text-2xl md:text-3xl font-bold">
                {(
                  ((data.affluenza!.votanti_donne + data.affluenza!.votanti_uomini) /
                    (data.affluenza!.aventi_diritto_donne + data.affluenza!.aventi_diritto_uomini)) *
                  100
                ).toFixed(1)}
                %
              </div>
              <div className="mt-1 text-xs md:text-sm text-gray-500">
                {(data.affluenza!.votanti_donne + data.affluenza!.votanti_uomini).toLocaleString('it-IT')}{' '}
                votanti su{' '}
                {(
                  data.affluenza!.aventi_diritto_donne + data.affluenza!.aventi_diritto_uomini
                ).toLocaleString('it-IT')}
              </div>
            </div>
          ) : (
            <div className="p-4 md:p-6 rounded-xl border border-gray-200 bg-white">
              <div className="text-base md:text-lg font-medium text-gray-600">Sezioni</div>
              <div className="mt-2 text-2xl md:text-3xl font-bold">
                {allSectionIds.length}
              </div>
              <div className="mt-1 text-xs md:text-sm text-gray-500">
                sezioni scrutinate
              </div>
            </div>
          )}
        </div>

        {/* Density selector */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <h3 className="text-sm font-semibold mb-3 text-gray-700">Visualizza Densità Voto</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCandidate('')}
              className={`px-3 py-1.5 text-xs rounded-full transition-colors ${!selectedCandidate ? 'bg-gray-800 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              Nessuna
            </button>
            {data.candidati.map((c, idx) => (
              <button
                key={c.nome}
                onClick={() => setSelectedCandidate(c.nome)}
                className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                  selectedCandidate === c.nome
                    ? idx === 0 ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {c.nome}
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
            {sectionData && sectionData.affluenza ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <div className="text-sm text-gray-600">Votanti</div>
                    <div className="text-xl font-bold">
                      {sectionData.affluenza.votanti_donne + sectionData.affluenza.votanti_uomini}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <div className="text-sm text-gray-600">Affluenza</div>
                    <div className="text-xl font-bold">
                      {(
                        ((sectionData.affluenza.votanti_donne + sectionData.affluenza.votanti_uomini) /
                          (sectionData.affluenza.aventi_diritto_donne +
                            sectionData.affluenza.aventi_diritto_uomini)) *
                        100
                      ).toFixed(1)}
                      %
                    </div>
                  </div>
                </div>
                {data.candidati.map((candidate, idx) => {
                  const votes = sectionData.voti[candidate.nome] || 0;
                  const sectionTotal = Object.values(sectionData.voti).reduce((a, b) => a + b, 0);
                  const pct = sectionTotal > 0 ? ((votes / sectionTotal) * 100).toFixed(1) : '0';
                  return (
                    <div key={candidate.nome}>
                      <div className="flex justify-between mb-1 text-sm">
                        <span className="font-medium">{candidate.nome}</span>
                        <span>
                          {votes} ({pct}%)
                        </span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${idx === 0 ? 'bg-blue-500' : 'bg-red-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : selectedSection && hasCandidateSezioni ? (
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg text-center mb-4">
                  <div className="text-sm text-gray-600">Voti Totali Sezione</div>
                  <div className="text-xl font-bold">
                    {data.candidati.reduce((s, c) => s + (c.sezioni?.[selectedSection.toString()] || 0), 0)}
                  </div>
                </div>
                {data.candidati.map((candidate, idx) => {
                  const votes = candidate.sezioni?.[selectedSection.toString()] || 0;
                  const sectionTotal = data.candidati.reduce((s, c) => s + (c.sezioni?.[selectedSection.toString()] || 0), 0);
                  const pct = sectionTotal > 0 ? ((votes / sectionTotal) * 100).toFixed(1) : '0';
                  return (
                    <div key={candidate.nome}>
                      <div className="flex justify-between mb-1 text-sm">
                        <span className="font-medium">{candidate.nome}</span>
                        <span>
                          {votes} ({pct}%)
                        </span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${idx === 0 ? 'bg-blue-500' : 'bg-red-500'}`}
                          style={{ width: `${pct}%` }}
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
                      {data.candidati.map((c) => (
                        <th key={c.nome} className="text-right py-2">
                          {c.nome.split(' ')[0]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {hasLegacySezioni ? (
                      Object.entries(data.sezioni!)
                        .sort(([a], [b]) => parseInt(a) - parseInt(b))
                        .map(([sectionId, section]) => (
                          <tr
                            key={sectionId}
                            className="border-b hover:bg-gray-50 cursor-pointer"
                            onClick={() => setSelectedSection(parseInt(sectionId))}
                          >
                            <td className="py-2 font-medium">{sectionId}</td>
                            {data.candidati.map((c, idx) => (
                              <td
                                key={c.nome}
                                className={`text-right py-2 ${
                                  section.voti[c.nome] ===
                                  Math.max(...Object.values(section.voti))
                                    ? idx === 0
                                      ? 'text-blue-600 font-bold'
                                      : 'text-red-600 font-bold'
                                    : ''
                                }`}
                              >
                                {section.voti[c.nome] || 0}
                              </td>
                            ))}
                          </tr>
                        ))
                    ) : hasCandidateSezioni ? (
                      allSectionIds.map((sectionId) => {
                        const votes = data.candidati.map(c => c.sezioni?.[sectionId.toString()] || 0);
                        const maxVotes = Math.max(...votes);
                        return (
                          <tr
                            key={sectionId}
                            className="border-b hover:bg-gray-50 cursor-pointer"
                            onClick={() => setSelectedSection(sectionId)}
                          >
                            <td className="py-2 font-medium">{sectionId}</td>
                            {data.candidati.map((c, idx) => {
                              const v = c.sezioni?.[sectionId.toString()] || 0;
                              return (
                                <td
                                  key={c.nome}
                                  className={`text-right py-2 ${
                                    v === maxVotes && v > 0
                                      ? idx === 0
                                        ? 'text-blue-600 font-bold'
                                        : 'text-red-600 font-bold'
                                      : ''
                                  }`}
                                >
                                  {v}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={data.candidati.length + 1} className="py-4 text-center text-gray-500">
                          Dati sezioni non disponibili
                        </td>
                      </tr>
                    )}
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
