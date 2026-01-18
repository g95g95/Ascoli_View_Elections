import { useState, useMemo } from 'react';
import { Header } from '../../components/layout/Header';
import { SectionMap } from '../../components/charts/SectionMap';
import type { PreferenzeElection, Party, Candidate } from '../../types/elections';
import { CONSOLIDATED_SECTIONS, CONSOLIDATED_SECTION_ID } from '../../types/elections';

interface PreferencesViewProps {
  data: PreferenzeElection;
  title: string;
}

export function PreferencesView({ data, title }: PreferencesViewProps) {
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<number | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'votes' | 'name'>('votes');

  const filteredCandidates = useMemo(() => {
    let candidates: (Candidate & { partyName: string })[] = [];

    if (selectedParty) {
      candidates = selectedParty.candidati.map((c) => ({
        ...c,
        partyName: selectedParty.nome,
      }));
    } else {
      data.liste.forEach((party) => {
        party.candidati.forEach((c) => {
          candidates.push({ ...c, partyName: party.nome });
        });
      });
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      candidates = candidates.filter(
        (c) => c.nome.toLowerCase().includes(query) || c.partyName.toLowerCase().includes(query)
      );
    }

    if (sortBy === 'votes') {
      candidates.sort((a, b) => b.totale - a.totale);
    } else {
      candidates.sort((a, b) => a.nome.localeCompare(b.nome));
    }

    return candidates;
  }, [data, selectedParty, searchQuery, sortBy]);

  const topCandidates = useMemo(() => {
    const all: (Candidate & { partyName: string })[] = [];
    data.liste.forEach((party) => {
      party.candidati.forEach((c) => {
        all.push({ ...c, partyName: party.nome });
      });
    });
    return all.sort((a, b) => b.totale - a.totale).slice(0, 50);
  }, [data]);

  const totalCandidates = data.liste.reduce((sum, party) => sum + party.candidati.length, 0);
  const totalVotes = data.liste.reduce(
    (sum, party) => sum + party.candidati.reduce((s, c) => s + c.totale, 0),
    0
  );

  const densityData = useMemo(() => {
    if (!selectedCandidate) return undefined;

    let candidateData: Candidate | null = null;
    data.liste.forEach(party => {
      const found = party.candidati.find(c => c.nome === selectedCandidate);
      if (found) candidateData = found;
    });

    if (!candidateData) return undefined;

    const allSectionIds = new Set<string>();
    data.liste.forEach(party => {
      party.candidati.forEach(c => {
        Object.keys(c.sezioni).forEach(id => allSectionIds.add(id));
      });
    });

    const result = Array.from(allSectionIds).map(sectionId => {
      let totalInSection = 0;
      data.liste.forEach(party => {
        party.candidati.forEach(c => {
          totalInSection += c.sezioni[sectionId] || 0;
        });
      });

      const value = candidateData!.sezioni[sectionId] || 0;
      return {
        sectionId: parseInt(sectionId),
        value,
        percentage: totalInSection > 0 ? (value / totalInSection) * 100 : 0,
      };
    });

    // Add section 53 (Centro Storico) with aggregated data from consolidated sections
    let totalInConsolidated = 0;
    let candidateInConsolidated = 0;
    CONSOLIDATED_SECTIONS.forEach(secId => {
      data.liste.forEach(party => {
        party.candidati.forEach(c => {
          totalInConsolidated += c.sezioni[secId.toString()] || 0;
        });
      });
      candidateInConsolidated += candidateData!.sezioni[secId.toString()] || 0;
    });

    result.push({
      sectionId: CONSOLIDATED_SECTION_ID,
      value: candidateInConsolidated,
      percentage: totalInConsolidated > 0 ? (candidateInConsolidated / totalInConsolidated) * 100 : 0,
    });

    return result;
  }, [data, selectedCandidate]);

  const getSectionCandidateVotes = (sectionId: number) => {
    const results: { name: string; party: string; votes: number }[] = [];

    // If it's the consolidated section, sum votes from all included sections
    const sectionsToSum = sectionId === CONSOLIDATED_SECTION_ID
      ? CONSOLIDATED_SECTIONS
      : [sectionId];

    data.liste.forEach(party => {
      party.candidati.forEach(c => {
        const votes = sectionsToSum.reduce((sum, secId) =>
          sum + (c.sezioni[secId.toString()] || 0), 0);
        if (votes > 0) {
          results.push({ name: c.nome, party: party.nome, votes });
        }
      });
    });
    return results.sort((a, b) => b.votes - a.votes);
  };

  const sectionCandidates = selectedSection ? getSectionCandidateVotes(selectedSection) : [];

  const selectedCandidatePercentage = useMemo(() => {
    if (!selectedSection || !selectedCandidate) return null;
    const allVotes = sectionCandidates.reduce((s, c) => s + c.votes, 0);
    const candidateVotes = sectionCandidates.find(c => c.name === selectedCandidate)?.votes || 0;
    return allVotes > 0 ? (candidateVotes / allVotes) * 100 : 0;
  }, [selectedSection, selectedCandidate, sectionCandidates]);

  return (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <Header title={title} subtitle={`${data.data} - ${totalCandidates} candidati, ${data.liste.length} liste`} />
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
            <select
              value={selectedCandidate}
              onChange={(e) => setSelectedCandidate(e.target.value)}
              className="px-3 py-1.5 text-sm border rounded-lg flex-1 md:flex-none md:min-w-80"
            >
              <option value="">Seleziona Candidato...</option>
              {topCandidates.map(c => (
                <option key={`${c.partyName}-${c.nome}`} value={c.nome}>
                  {c.nome} ({c.partyName.substring(0, 20)}) - {c.totale} voti
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Map and Section Detail */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 mb-6">
          <SectionMap
            selectedSection={selectedSection}
            onSectionClick={setSelectedSection}
            densityData={densityData}
            densityColor="#8b5cf6"
            showLegend={!!selectedCandidate}
            legendLabel={selectedCandidate}
          />

          <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
            {selectedSection ? (
              <>
                <h3 className="text-lg font-semibold mb-4">Sezione {selectedSection} - Top Preferenze</h3>
                {selectedCandidate && selectedCandidatePercentage !== null && (
                  <div className="mb-4 p-3 rounded-lg bg-purple-50 border border-purple-200">
                    <div className="text-sm text-purple-600 font-medium">{selectedCandidate}</div>
                    <div className="text-2xl font-bold text-purple-700">{selectedCandidatePercentage.toFixed(1)}%</div>
                    <div className="text-xs text-purple-500">
                      {sectionCandidates.find(c => c.name === selectedCandidate)?.votes || 0} voti in questa sezione
                    </div>
                  </div>
                )}
                <div className="space-y-1 max-h-80 overflow-y-auto">
                  {sectionCandidates.slice(0, 20).map((c, idx) => {
                    const isSelected = c.name === selectedCandidate;
                    return (
                      <div
                        key={`${c.party}-${c.name}`}
                        className={`flex justify-between text-sm p-1.5 rounded cursor-pointer ${isSelected ? 'bg-purple-50 border border-purple-200' : 'hover:bg-gray-50'}`}
                        onClick={() => setSelectedCandidate(c.name)}
                      >
                        <span className="truncate flex items-center gap-1">
                          <span className={`w-5 h-5 flex items-center justify-center rounded-full text-xs ${idx < 3 ? 'bg-amber-500 text-white' : 'bg-gray-200'}`}>
                            {idx + 1}
                          </span>
                          <span className="truncate" title={`${c.name} (${c.party})`}>
                            {c.name}
                          </span>
                        </span>
                        <span className="ml-2 font-medium text-purple-600">{c.votes}</span>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => setSelectedSection(undefined)}
                  className="mt-4 text-sm text-blue-600 hover:underline"
                >
                  ← Torna alla vista generale
                </button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-4">Top 10 Candidati</h3>
                <div className="space-y-2">
                  {topCandidates.slice(0, 10).map((c, idx) => {
                    const isSelected = c.nome === selectedCandidate;
                    return (
                      <div
                        key={`${c.nome}-${c.partyName}`}
                        className={`flex items-center gap-2 text-sm p-2 rounded cursor-pointer ${isSelected ? 'bg-purple-50 border border-purple-200' : 'hover:bg-gray-50'}`}
                        onClick={() => setSelectedCandidate(c.nome)}
                      >
                        <span
                          className={`w-6 h-6 flex items-center justify-center rounded-full text-white text-xs font-bold ${
                            idx < 3 ? 'bg-amber-500' : 'bg-gray-400'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div className="flex-1 truncate">
                          <span className="font-medium">{c.nome}</span>
                          <span className="text-gray-400 ml-1 text-xs">({c.partyName.substring(0, 15)})</span>
                        </div>
                        <span className="font-bold text-purple-600">{c.totale}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Party List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold mb-3">Liste</h3>
              <button
                onClick={() => setSelectedParty(null)}
                className={`w-full text-left px-3 py-2 rounded-lg mb-1 text-sm ${
                  !selectedParty ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'
                }`}
              >
                Tutte le liste ({totalCandidates})
              </button>
              <div className="max-h-64 overflow-y-auto">
                {data.liste.map((party) => (
                  <button
                    key={party.nome}
                    onClick={() => setSelectedParty(party)}
                    className={`w-full text-left px-3 py-2 rounded-lg mb-1 text-sm ${
                      selectedParty?.nome === party.nome
                        ? 'bg-blue-100 text-blue-800'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium truncate">{party.nome}</div>
                    <div className="text-xs text-gray-500">{party.candidati.length} candidati</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Candidates */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex-1 min-w-48">
                  <input
                    type="text"
                    placeholder="Cerca candidato..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSortBy('votes')}
                    className={`px-3 py-2 text-sm rounded-lg ${
                      sortBy === 'votes' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    Per Voti
                  </button>
                  <button
                    onClick={() => setSortBy('name')}
                    className={`px-3 py-2 text-sm rounded-lg ${
                      sortBy === 'name' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    Per Nome
                  </button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
                <div className="text-xl font-bold text-blue-700">{data.liste.length}</div>
                <div className="text-xs text-blue-600">Liste</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
                <div className="text-xl font-bold text-green-700">{totalCandidates}</div>
                <div className="text-xs text-green-600">Candidati</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
                <div className="text-xl font-bold text-purple-700">{totalVotes.toLocaleString('it-IT')}</div>
                <div className="text-xs text-purple-600">Preferenze</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
                <div className="text-xl font-bold text-amber-700">{(totalVotes / totalCandidates).toFixed(0)}</div>
                <div className="text-xs text-amber-600">Media</div>
              </div>
            </div>

            {/* Candidates Table */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold mb-3">
                Candidati ({filteredCandidates.length})
                {selectedParty && <span className="font-normal text-gray-500"> - {selectedParty.nome}</span>}
              </h3>
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white border-b">
                    <tr>
                      <th className="text-left py-2 px-2">#</th>
                      <th className="text-left py-2 px-2">Candidato</th>
                      {!selectedParty && <th className="text-left py-2 px-2 hidden md:table-cell">Lista</th>}
                      <th className="text-right py-2 px-2">Voti</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCandidates.slice(0, 100).map((c, idx) => {
                      const isSelected = c.nome === selectedCandidate;
                      return (
                        <tr
                          key={`${c.nome}-${c.partyName}-${idx}`}
                          className={`border-b cursor-pointer ${isSelected ? 'bg-purple-50' : 'hover:bg-gray-50'}`}
                          onClick={() => setSelectedCandidate(c.nome)}
                        >
                          <td className="py-2 px-2 text-gray-500">{idx + 1}</td>
                          <td className="py-2 px-2 font-medium">{c.nome}</td>
                          {!selectedParty && (
                            <td className="py-2 px-2 text-gray-600 truncate max-w-32 hidden md:table-cell">{c.partyName}</td>
                          )}
                          <td className="py-2 px-2 text-right font-bold text-purple-600">{c.totale}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
