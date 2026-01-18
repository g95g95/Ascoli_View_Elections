import { useState, useMemo } from 'react';
import { Header } from '../../components/layout/Header';
import { SectionMap } from '../../components/charts/SectionMap';
import type { CoalizioniData } from '../../types/elections';
import { CONSOLIDATED_SECTIONS, CONSOLIDATED_SECTION_ID } from '../../types/elections';

interface ListeRegionaliViewProps {
  data: CoalizioniData;
  title: string;
}

const PARTY_COLORS: Record<string, string> = {
  'PDL': '#0066cc',
  'PD': '#e2001a',
  'LEGA': '#008000',
  'UDC': '#0047ab',
  'IDV': '#ff6600',
  'default': '#3b82f6',
};

export function ListeRegionaliView({ data, title }: ListeRegionaliViewProps) {
  const [selectedParty, setSelectedParty] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<number | undefined>();

  const sortedListe = [...data.liste].sort((a, b) => b.totale - a.totale);
  const totalVotes = sortedListe.reduce((sum, l) => sum + l.totale, 0);

  const densityData = useMemo(() => {
    if (!selectedParty) return undefined;

    const party = data.liste.find(l => l.nome === selectedParty);
    if (!party) return undefined;

    const result = Object.entries(party.sezioni).map(([sectionId, votes]) => {
      const sectionTotal = data.liste.reduce((sum, l) => sum + (l.sezioni[sectionId] || 0), 0);
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
      consolidatedVotes += party.sezioni[secId.toString()] || 0;
      consolidatedTotal += data.liste.reduce((sum, l) => sum + (l.sezioni[secId.toString()] || 0), 0);
    });

    result.push({
      sectionId: CONSOLIDATED_SECTION_ID,
      value: consolidatedVotes,
      percentage: consolidatedTotal > 0 ? (consolidatedVotes / consolidatedTotal) * 100 : 0,
    });

    return result;
  }, [data.liste, selectedParty]);

  const getDensityColor = () => {
    if (!selectedParty) return PARTY_COLORS.default;
    for (const [key, color] of Object.entries(PARTY_COLORS)) {
      if (selectedParty.toUpperCase().includes(key)) return color;
    }
    return PARTY_COLORS.default;
  };

  const sectionData = useMemo(() => {
    if (!selectedSection) return null;

    if (selectedSection === CONSOLIDATED_SECTION_ID) {
      const voti: Record<string, number> = {};
      data.liste.forEach(l => {
        CONSOLIDATED_SECTIONS.forEach(secId => {
          voti[l.nome] = (voti[l.nome] || 0) + (l.sezioni[secId.toString()] || 0);
        });
      });
      return voti;
    }

    const voti: Record<string, number> = {};
    data.liste.forEach(l => {
      voti[l.nome] = l.sezioni[selectedSection.toString()] || 0;
    });
    return voti;
  }, [selectedSection, data.liste]);

  const selectedPartyPercentage = useMemo(() => {
    if (!selectedSection || !selectedParty || !sectionData) return null;
    const total = Object.values(sectionData).reduce((s, v) => s + v, 0);
    const votes = sectionData[selectedParty] || 0;
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
              {sortedListe.map(party => (
                <option key={party.nome} value={party.nome}>{party.nome}</option>
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
                    <div className="text-xs text-blue-500">{sectionData[selectedParty] || 0} voti in questa sezione</div>
                  </div>
                )}
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {Object.entries(sectionData)
                    .sort(([, a], [, b]) => b - a)
                    .map(([name, votes], idx) => {
                      const total = Object.values(sectionData).reduce((s, v) => s + v, 0);
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
                <h3 className="text-lg font-semibold mb-4">Risultati Liste Regionali</h3>
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
