import { useState, useMemo } from 'react';
import { Header } from '../../components/layout/Header';
import { SectionMap } from '../../components/charts/SectionMap';
import type { ListeElection } from '../../types/elections';
import { CONSOLIDATED_SECTIONS, CONSOLIDATED_SECTION_ID } from '../../types/elections';

interface ListeViewProps {
  data: ListeElection;
  title: string;
}

const PARTY_COLORS: Record<string, string> = {
  'PDL': '#0066cc',
  'PD': '#e2001a',
  'LEGA': '#008000',
  'UDC': '#0047ab',
  'IDV': '#ff6600',
  'FORZA ITALIA': '#0066cc',
  'FRATELLI D\'ITALIA': '#003399',
  'MOVIMENTO 5 STELLE': '#ffeb3b',
  'default': '#3b82f6',
};

export function ListeView({ data, title }: ListeViewProps) {
  const [selectedParty, setSelectedParty] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<number | undefined>();

  const sortedListe = [...data.liste].sort((a, b) => b.totale - a.totale);
  const totalVotes = sortedListe.reduce((sum, l) => sum + l.totale, 0);

  const partyList = useMemo(() => {
    if (data.sezioni) {
      const firstSection = Object.values(data.sezioni)[0];
      if (firstSection) return Object.keys(firstSection.voti).sort();
    }
    return sortedListe.map(l => l.nome);
  }, [data, sortedListe]);

  // Check if data uses new format (liste[].sezioni) or old format (sezioni object)
  const usesNewFormat = !data.sezioni && data.liste.some(l => l.sezioni);

  const densityData = useMemo(() => {
    if (!selectedParty) return undefined;

    const result: { sectionId: number; value: number; percentage: number }[] = [];

    if (data.sezioni) {
      // Old format: data.sezioni contains per-section voti
      Object.entries(data.sezioni).forEach(([sectionId, section]) => {
        const total = Object.values(section.voti).reduce((s, v) => s + v, 0);
        const value = section.voti[selectedParty] || 0;
        result.push({
          sectionId: parseInt(sectionId),
          value,
          percentage: total > 0 ? (value / total) * 100 : 0,
        });
      });

      // Add consolidated section 53
      let totalInConsolidated = 0;
      let partyInConsolidated = 0;
      CONSOLIDATED_SECTIONS.forEach(secId => {
        const sec = data.sezioni![secId.toString()];
        if (sec) {
          totalInConsolidated += Object.values(sec.voti).reduce((s, v) => s + v, 0);
          partyInConsolidated += sec.voti[selectedParty] || 0;
        }
      });

      if (totalInConsolidated > 0) {
        result.push({
          sectionId: CONSOLIDATED_SECTION_ID,
          value: partyInConsolidated,
          percentage: (partyInConsolidated / totalInConsolidated) * 100,
        });
      }
    } else if (usesNewFormat) {
      // New format: each lista has its own sezioni object
      const party = data.liste.find(l => l.nome === selectedParty);
      if (!party?.sezioni) return undefined;

      // Collect all unique section IDs from all parties
      const allSectionIds = new Set<string>();
      data.liste.forEach(l => {
        if (l.sezioni) Object.keys(l.sezioni).forEach(s => allSectionIds.add(s));
      });

      allSectionIds.forEach(sectionId => {
        const value = party.sezioni![sectionId] || 0;
        const total = data.liste.reduce((sum, l) => sum + (l.sezioni?.[sectionId] || 0), 0);
        if (total > 0) {
          result.push({
            sectionId: parseInt(sectionId),
            value,
            percentage: (value / total) * 100,
          });
        }
      });

      // Add consolidated section 53
      let totalInConsolidated = 0;
      let partyInConsolidated = 0;
      CONSOLIDATED_SECTIONS.forEach(secId => {
        const secStr = secId.toString();
        partyInConsolidated += party.sezioni![secStr] || 0;
        totalInConsolidated += data.liste.reduce((sum, l) => sum + (l.sezioni?.[secStr] || 0), 0);
      });

      if (totalInConsolidated > 0) {
        result.push({
          sectionId: CONSOLIDATED_SECTION_ID,
          value: partyInConsolidated,
          percentage: (partyInConsolidated / totalInConsolidated) * 100,
        });
      }
    }

    return result.length > 0 ? result : undefined;
  }, [data.sezioni, data.liste, selectedParty, usesNewFormat]);

  const getDensityColor = () => {
    if (!selectedParty) return PARTY_COLORS.default;
    for (const [key, color] of Object.entries(PARTY_COLORS)) {
      if (selectedParty.toUpperCase().includes(key)) return color;
    }
    return PARTY_COLORS.default;
  };

  // For consolidated section, sum votes from all included sections
  const sectionData = useMemo(() => {
    if (!selectedSection) return null;

    if (data.sezioni) {
      // Old format: data.sezioni contains per-section voti
      if (selectedSection === CONSOLIDATED_SECTION_ID) {
        const combinedVoti: Record<string, number> = {};
        CONSOLIDATED_SECTIONS.forEach(secId => {
          const sec = data.sezioni![secId.toString()];
          if (sec) {
            Object.entries(sec.voti).forEach(([party, votes]) => {
              combinedVoti[party] = (combinedVoti[party] || 0) + votes;
            });
          }
        });
        return { voti: combinedVoti };
      }
      return data.sezioni[selectedSection.toString()] || null;
    } else if (usesNewFormat) {
      // New format: aggregate from each lista's sezioni
      const combinedVoti: Record<string, number> = {};

      if (selectedSection === CONSOLIDATED_SECTION_ID) {
        // Aggregate from all consolidated sections
        data.liste.forEach(lista => {
          if (lista.sezioni) {
            let totalForLista = 0;
            CONSOLIDATED_SECTIONS.forEach(secId => {
              totalForLista += lista.sezioni![secId.toString()] || 0;
            });
            if (totalForLista > 0) {
              combinedVoti[lista.nome] = totalForLista;
            }
          }
        });
      } else {
        // Single section
        data.liste.forEach(lista => {
          if (lista.sezioni) {
            const votes = lista.sezioni[selectedSection.toString()] || 0;
            if (votes > 0) {
              combinedVoti[lista.nome] = votes;
            }
          }
        });
      }

      return Object.keys(combinedVoti).length > 0 ? { voti: combinedVoti } : null;
    }

    return null;
  }, [selectedSection, data.sezioni, data.liste, usesNewFormat]);

  const selectedPartyPercentage = useMemo(() => {
    if (!selectedSection || !selectedParty || !sectionData) return null;
    const total = Object.values(sectionData.voti).reduce((s, v) => s + v, 0);
    const votes = sectionData.voti[selectedParty] || 0;
    return total > 0 ? (votes / total) * 100 : 0;
  }, [selectedSection, selectedParty, sectionData]);

  return (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <Header title={title} subtitle={`${data.data} - ${data.liste.length} liste`} />
      <div className="p-4 md:p-6">
        {/* Density Controls */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <h3 className="text-sm font-semibold mb-3 text-gray-700">Visualizza Densità Voto per Lista</h3>
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={() => setSelectedParty('')}
              className={`px-3 py-1.5 text-xs rounded-full transition-colors ${!selectedParty ? 'bg-gray-800 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              Nessuna
            </button>
            <select
              value={selectedParty}
              onChange={(e) => setSelectedParty(e.target.value)}
              className="px-3 py-1.5 text-sm border rounded-lg flex-1 md:flex-none md:min-w-64"
            >
              <option value="">Seleziona Lista...</option>
              {partyList.map(party => (
                <option key={party} value={party}>{party}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 mb-6">
          {/* Map */}
          <SectionMap
            selectedSection={selectedSection}
            onSectionClick={setSelectedSection}
            densityData={densityData}
            densityColor={getDensityColor()}
            showLegend={!!selectedParty}
            legendLabel={selectedParty}
          />

          {/* Section Detail or Results */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
            {sectionData ? (
              <>
                <h3 className="text-lg font-semibold mb-4">Sezione {selectedSection}</h3>
                {selectedParty && selectedPartyPercentage !== null && (
                  <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="text-sm text-blue-600 font-medium">{selectedParty}</div>
                    <div className="text-2xl font-bold text-blue-700">{selectedPartyPercentage.toFixed(1)}%</div>
                    <div className="text-xs text-blue-500">{sectionData.voti[selectedParty] || 0} voti in questa sezione</div>
                  </div>
                )}
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {Object.entries(sectionData.voti)
                    .sort(([, a], [, b]) => b - a)
                    .map(([name, votes], idx) => {
                      const total = Object.values(sectionData.voti).reduce((s, v) => s + v, 0);
                      const pct = ((votes / total) * 100).toFixed(1);
                      const isSelected = name === selectedParty;
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
                              className="h-full bg-blue-500"
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
                <h3 className="text-lg font-semibold mb-4">Risultati Liste</h3>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {sortedListe.slice(0, 15).map((lista, idx) => {
                    const pct = ((lista.totale / totalVotes) * 100).toFixed(1);
                    const isSelected = lista.nome === selectedParty;
                    return (
                      <div
                        key={lista.nome}
                        className={`cursor-pointer p-2 rounded transition-colors ${isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}`}
                        onClick={() => setSelectedParty(lista.nome)}
                      >
                        <div className="flex justify-between mb-1">
                          <span className="font-medium text-sm truncate flex-1 flex items-center gap-1">
                            <span className={`w-5 h-5 flex items-center justify-center rounded-full text-xs ${idx < 3 ? 'bg-amber-500 text-white' : 'bg-gray-200'}`}>
                              {idx + 1}
                            </span>
                            <span className="truncate">{lista.nome}</span>
                          </span>
                          <span className="text-sm ml-2">
                            {lista.totale.toLocaleString('it-IT')} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                            style={{ width: `${parseFloat(pct) * 2}%` }}
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
            <div className="text-2xl md:text-3xl font-bold text-green-700">{data.liste.length}</div>
            <div className="text-sm text-green-600">Liste</div>
          </div>
          <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-lg md:text-xl font-bold text-amber-700 truncate">{sortedListe[0]?.nome}</div>
            <div className="text-sm text-amber-600">
              Prima Lista - {sortedListe[0]?.totale.toLocaleString('it-IT')} voti
            </div>
          </div>
        </div>

        {/* Full Ranking Table */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
          <h3 className="text-lg font-semibold mb-4">Classifica Completa</h3>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left py-3 px-4">#</th>
                  <th className="text-left py-3 px-4">Lista</th>
                  <th className="text-right py-3 px-4">Voti</th>
                  <th className="text-right py-3 px-4">%</th>
                </tr>
              </thead>
              <tbody>
                {sortedListe.map((lista, idx) => {
                  const pct = ((lista.totale / totalVotes) * 100).toFixed(2);
                  const isSelected = lista.nome === selectedParty;
                  return (
                    <tr
                      key={lista.nome}
                      className={`border-b cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                      onClick={() => setSelectedParty(lista.nome)}
                    >
                      <td className="py-3 px-4">
                        <span
                          className={`w-6 h-6 inline-flex items-center justify-center rounded-full text-xs font-bold ${
                            idx < 3 ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium">{lista.nome}</td>
                      <td className="py-3 px-4 text-right font-bold text-blue-600">
                        {lista.totale.toLocaleString('it-IT')}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
