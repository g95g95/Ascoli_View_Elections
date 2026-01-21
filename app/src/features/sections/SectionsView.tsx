import { useState, useMemo } from 'react';
import { Header } from '../../components/layout/Header';
import { SectionMap } from '../../components/charts/SectionMap';
import { TimeSeriesModal } from '../../components/charts/TimeSeriesModal';
import type { ElectionData, ElectionArchive } from '../../lib/dataLoader';
import { CONSOLIDATED_SECTIONS, CONSOLIDATED_SECTION_ID } from '../../types/elections';
import type { ElectionConfig } from '../../types/elections';

const GLOBAL_SECTION_ID = 0;

interface SectionsViewProps {
  electionData: ElectionData;
  archive?: ElectionArchive;
  electionConfig?: ElectionConfig;
}

type DensityMode = 'none' | 'party' | 'candidate' | 'ballottaggio';

const PARTY_COLORS: Record<string, string> = {
  'PDL': '#0066cc',
  'PD': '#e2001a',
  'LEGA': '#008000',
  'UDC': '#0047ab',
  'IDV': '#ff6600',
  'default': '#3b82f6',
};

const CANDIDATE_COLORS: Record<string, string> = {
  'CASTELLI': '#3b82f6',
  'CELANI': '#ef4444',
  'default': '#8b5cf6',
};

export function SectionsView({ electionData, archive, electionConfig }: SectionsViewProps) {
  const [selectedSection, setSelectedSection] = useState<number | undefined>();
  const [densityMode, setDensityMode] = useState<DensityMode>('none');
  const [selectedParty, setSelectedParty] = useState<string>('');
  const [selectedCandidate, setSelectedCandidate] = useState<string>('');
  const [timeSeriesOpen, setTimeSeriesOpen] = useState(false);
  const [timeSeriesItem, setTimeSeriesItem] = useState<{
    type: 'party' | 'candidate';
    name: string;
    party?: string;
  } | null>(null);
  const [sectionSearch, setSectionSearch] = useState<string>('');

  const { config, ballottaggio, primoTurno, liste, preferenze, votanti, nominali } = electionData;

  const handlePartyClick = (partyName: string) => {
    if (!archive || !electionConfig) return;
    setTimeSeriesItem({ type: 'party', name: partyName });
    setTimeSeriesOpen(true);
  };

  const handleCandidateClick = (candidateName: string, partyName?: string) => {
    if (!archive || !electionConfig) return;
    setTimeSeriesItem({ type: 'candidate', name: candidateName, party: partyName });
    setTimeSeriesOpen(true);
  };

  // Get all sections from available data
  const allSections = useMemo(() => {
    if (ballottaggio?.sezioni) {
      return Object.keys(ballottaggio.sezioni).map(Number).sort((a, b) => a - b);
    }
    if (liste?.sezioni) {
      return Object.keys(liste.sezioni).map(Number).sort((a, b) => a - b);
    }
    if (preferenze) {
      const sections = new Set<number>();
      preferenze.liste.forEach(party => {
        party.candidati.forEach(c => {
          Object.keys(c.sezioni).forEach(s => sections.add(parseInt(s)));
        });
      });
      return [...sections].sort((a, b) => a - b);
    }
    if (nominali) {
      const sections = new Set<number>();
      nominali.candidati.forEach(c => {
        Object.keys(c.sezioni).forEach(s => sections.add(parseInt(s)));
      });
      return [...sections].sort((a, b) => a - b);
    }
    if (liste?.liste) {
      const sections = new Set<number>();
      liste.liste.forEach(l => {
        if (l.sezioni) Object.keys(l.sezioni).forEach(s => sections.add(parseInt(s)));
      });
      if (sections.size > 0) return [...sections].sort((a, b) => a - b);
    }
    if (votanti) {
      return votanti.sezioni.map(s => s.numero).sort((a, b) => a - b);
    }
    return [];
  }, [ballottaggio, liste, preferenze, votanti, nominali]);

  const hasBallottaggio = !!ballottaggio;
  const hasListe = !!liste?.sezioni || !!liste?.liste;
  const hasPreferenze = !!preferenze;
  const hasNominali = !!nominali;

  const partyList = useMemo(() => {
    if (liste?.sezioni) {
      const firstSection = Object.values(liste.sezioni)[0];
      if (firstSection) return Object.keys(firstSection.voti).sort();
    }
    if (liste?.liste) {
      return liste.liste.map(l => l.nome).sort();
    }
    if (preferenze) {
      return preferenze.liste.map(l => l.nome).sort();
    }
    return [];
  }, [liste, preferenze]);

  const candidateList = useMemo(() => {
    if (nominali) {
      return nominali.candidati
        .map(c => ({ name: c.nome, party: 'Uninominale', total: c.totale }))
        .sort((a, b) => b.total - a.total);
    }
    if (!preferenze) return [];
    const candidates: { name: string; party: string; total: number }[] = [];
    preferenze.liste.forEach(party => {
      party.candidati.forEach(c => {
        candidates.push({ name: c.nome, party: party.nome, total: c.totale });
      });
    });
    return candidates.sort((a, b) => b.total - a.total).slice(0, 50);
  }, [preferenze, nominali]);

  const ballottaggioCandidates = ballottaggio?.candidati.map(c => c.nome) || [];

  const densityData = useMemo(() => {
    if (densityMode === 'none') return undefined;

    const result: { sectionId: number; value: number; percentage: number }[] = [];

    allSections.forEach(sectionId => {
      let value = 0;
      let total = 0;

      if (densityMode === 'party' && selectedParty) {
        if (liste?.sezioni) {
          const sectionData = liste.sezioni[sectionId.toString()];
          if (sectionData) {
            value = sectionData.voti[selectedParty] || 0;
            total = Object.values(sectionData.voti).reduce((s, v) => s + v, 0);
          }
        } else if (liste?.liste) {
          const party = liste.liste.find(l => l.nome === selectedParty);
          if (party?.sezioni) {
            value = party.sezioni[sectionId.toString()] || 0;
            total = liste.liste.reduce((s, l) => s + (l.sezioni?.[sectionId.toString()] || 0), 0);
          }
        } else if (preferenze) {
          const party = preferenze.liste.find(p => p.nome === selectedParty);
          if (party) {
            value = party.candidati.reduce((s, c) => s + (c.sezioni[sectionId.toString()] || 0), 0);
            total = preferenze.liste.reduce((s, p) =>
              s + p.candidati.reduce((ss, c) => ss + (c.sezioni[sectionId.toString()] || 0), 0), 0);
          }
        }
      } else if (densityMode === 'candidate' && selectedCandidate) {
        if (nominali) {
          const candidate = nominali.candidati.find(c => c.nome === selectedCandidate);
          if (candidate) {
            value = candidate.sezioni[sectionId.toString()] || 0;
            total = nominali.candidati.reduce((s, c) => s + (c.sezioni[sectionId.toString()] || 0), 0);
          }
        } else if (preferenze) {
          preferenze.liste.forEach(party => {
            const candidate = party.candidati.find(c => c.nome === selectedCandidate);
            if (candidate) {
              value = candidate.sezioni[sectionId.toString()] || 0;
            }
          });
          if (liste?.sezioni) {
            const sectionData = liste.sezioni[sectionId.toString()];
            if (sectionData) {
              total = Object.values(sectionData.voti).reduce((s, v) => s + v, 0);
            }
          } else {
            total = preferenze.liste.reduce((s, p) =>
              s + p.candidati.reduce((ss, c) => ss + (c.sezioni[sectionId.toString()] || 0), 0), 0);
          }
        }
      } else if (densityMode === 'ballottaggio' && selectedCandidate && ballottaggio) {
        const sectionData = ballottaggio.sezioni?.[sectionId.toString()];
        if (sectionData) {
          value = sectionData.voti[selectedCandidate] || 0;
          total = Object.values(sectionData.voti).reduce((s, v) => s + v, 0);
        }
      }

      if (total > 0) {
        result.push({
          sectionId,
          value,
          percentage: (value / total) * 100,
        });
      }
    });

    // Add consolidated section 53
    let consolidatedValue = 0;
    let consolidatedTotal = 0;

    CONSOLIDATED_SECTIONS.forEach(secId => {
      const existing = result.find(r => r.sectionId === secId);
      if (existing) {
        consolidatedValue += existing.value;
        consolidatedTotal += existing.value / (existing.percentage / 100);
      }
    });

    if (consolidatedTotal > 0) {
      result.push({
        sectionId: CONSOLIDATED_SECTION_ID,
        value: consolidatedValue,
        percentage: (consolidatedValue / consolidatedTotal) * 100,
      });
    }

    return result;
  }, [densityMode, selectedParty, selectedCandidate, allSections, liste, preferenze, ballottaggio, nominali]);

  const getDensityColor = () => {
    if (densityMode === 'party' && selectedParty) {
      return PARTY_COLORS[selectedParty] || PARTY_COLORS.default;
    }
    if (densityMode === 'ballottaggio' && selectedCandidate) {
      const candidateSurname = selectedCandidate.split(' ')[0];
      return CANDIDATE_COLORS[candidateSurname] || CANDIDATE_COLORS.default;
    }
    return PARTY_COLORS.default;
  };

  const getConsolidatedBallottaggioData = () => {
    if (!ballottaggio) return null;
    const consolidated = {
      affluenza: { aventi_diritto_donne: 0, aventi_diritto_uomini: 0, votanti_donne: 0, votanti_uomini: 0, schede_bianche: 0, schede_nulle: 0 },
      voti: {} as Record<string, number>,
    };
    CONSOLIDATED_SECTIONS.forEach((sectionId) => {
      const section = ballottaggio.sezioni?.[sectionId.toString()];
      if (section) {
        consolidated.affluenza.aventi_diritto_donne += section.affluenza?.aventi_diritto_donne || 0;
        consolidated.affluenza.aventi_diritto_uomini += section.affluenza?.aventi_diritto_uomini || 0;
        consolidated.affluenza.votanti_donne += section.affluenza?.votanti_donne || 0;
        consolidated.affluenza.votanti_uomini += section.affluenza?.votanti_uomini || 0;
        consolidated.affluenza.schede_bianche += section.affluenza?.schede_bianche || 0;
        consolidated.affluenza.schede_nulle += section.affluenza?.schede_nulle || 0;
        Object.entries(section.voti).forEach(([name, votes]) => {
          consolidated.voti[name] = (consolidated.voti[name] || 0) + votes;
        });
      }
    });
    return consolidated;
  };

  const getGlobalBallottaggioData = () => {
    if (!ballottaggio) return null;
    const global = {
      affluenza: {
        aventi_diritto_donne: ballottaggio.affluenza?.aventi_diritto_donne || 0,
        aventi_diritto_uomini: ballottaggio.affluenza?.aventi_diritto_uomini || 0,
        votanti_donne: ballottaggio.affluenza?.votanti_donne || 0,
        votanti_uomini: ballottaggio.affluenza?.votanti_uomini || 0,
        schede_bianche: ballottaggio.affluenza?.schede_bianche || 0,
        schede_nulle: ballottaggio.affluenza?.schede_nulle || 0,
      },
      voti: {} as Record<string, number>,
    };
    ballottaggio.candidati.forEach(c => {
      global.voti[c.nome] = c.totale;
    });
    return global;
  };

  const getGlobalListeData = () => {
    if (liste?.liste) {
      const result: Record<string, number> = {};
      liste.liste.forEach(l => {
        result[l.nome] = l.totale;
      });
      return result;
    }
    if (liste?.sezioni) {
      const result: Record<string, number> = {};
      Object.values(liste.sezioni).forEach(sec => {
        Object.entries(sec.voti).forEach(([name, votes]) => {
          result[name] = (result[name] || 0) + votes;
        });
      });
      return result;
    }
    return null;
  };

  const getGlobalPreferenzeData = () => {
    if (!preferenze) return [];
    const results: { party: string; candidate: string; votes: number }[] = [];
    preferenze.liste.forEach(party => {
      party.candidati.forEach(candidate => {
        results.push({ party: party.nome, candidate: candidate.nome, votes: candidate.totale });
      });
    });
    return results.sort((a, b) => b.votes - a.votes);
  };

  const getGlobalNominaliData = () => {
    if (!nominali) return [];
    return nominali.candidati
      .map(c => ({ candidate: c.nome, votes: c.totale }))
      .sort((a, b) => b.votes - a.votes);
  };

  const getGlobalVotantiData = () => {
    if (!votanti) return null;
    return votanti.totale_comune;
  };

  const getSectionListeData = (sectionId: number) => {
    if (!liste?.sezioni) return null;
    if (sectionId === GLOBAL_SECTION_ID) return getGlobalListeData();
    if (sectionId === CONSOLIDATED_SECTION_ID) {
      const consolidated: Record<string, number> = {};
      CONSOLIDATED_SECTIONS.forEach((id) => {
        const sectionData = liste.sezioni?.[id.toString()];
        if (sectionData) {
          Object.entries(sectionData.voti).forEach(([name, votes]) => {
            consolidated[name] = (consolidated[name] || 0) + votes;
          });
        }
      });
      return consolidated;
    }
    return liste.sezioni[sectionId.toString()]?.voti || null;
  };

  const getSectionPreferenzeData = (sectionId: number) => {
    if (!preferenze) return [];
    if (sectionId === GLOBAL_SECTION_ID) return getGlobalPreferenzeData();
    const results: { party: string; candidate: string; votes: number }[] = [];
    preferenze.liste.forEach((party) => {
      party.candidati.forEach((candidate) => {
        if (sectionId === CONSOLIDATED_SECTION_ID) {
          const totalVotes = CONSOLIDATED_SECTIONS.reduce((sum, id) => sum + (candidate.sezioni[id.toString()] || 0), 0);
          if (totalVotes > 0) results.push({ party: party.nome, candidate: candidate.nome, votes: totalVotes });
        } else {
          const votes = candidate.sezioni[sectionId.toString()] || 0;
          if (votes > 0) results.push({ party: party.nome, candidate: candidate.nome, votes });
        }
      });
    });
    return results.sort((a, b) => b.votes - a.votes);
  };

  const getSectionVotantiData = (sectionId: number) => {
    if (!votanti) return null;
    if (sectionId === GLOBAL_SECTION_ID) return getGlobalVotantiData();
    if (sectionId === CONSOLIDATED_SECTION_ID) {
      const consolidated = { uomini: 0, donne: 0, totale: 0 };
      CONSOLIDATED_SECTIONS.forEach(id => {
        const section = votanti.sezioni.find(s => s.numero === id);
        if (section) {
          consolidated.uomini += section.uomini;
          consolidated.donne += section.donne;
          consolidated.totale += section.totale;
        }
      });
      return consolidated;
    }
    return votanti.sezioni.find(s => s.numero === sectionId) || null;
  };

  const getSectionNominaliData = (sectionId: number) => {
    if (!nominali) return [];
    if (sectionId === GLOBAL_SECTION_ID) return getGlobalNominaliData();
    const results: { candidate: string; votes: number }[] = [];
    nominali.candidati.forEach((candidate) => {
      if (sectionId === CONSOLIDATED_SECTION_ID) {
        const totalVotes = CONSOLIDATED_SECTIONS.reduce((sum, id) => sum + (candidate.sezioni[id.toString()] || 0), 0);
        if (totalVotes > 0) results.push({ candidate: candidate.nome, votes: totalVotes });
      } else {
        const votes = candidate.sezioni[sectionId.toString()] || 0;
        if (votes > 0) results.push({ candidate: candidate.nome, votes });
      }
    });
    return results.sort((a, b) => b.votes - a.votes);
  };

  const getSectionListeFromArray = (sectionId: number) => {
    if (!liste?.liste) return null;
    if (sectionId === GLOBAL_SECTION_ID) return getGlobalListeData();
    const results: Record<string, number> = {};
    if (sectionId === CONSOLIDATED_SECTION_ID) {
      liste.liste.forEach(l => {
        const totalVotes = CONSOLIDATED_SECTIONS.reduce((sum, id) => sum + (l.sezioni?.[id.toString()] || 0), 0);
        if (totalVotes > 0) results[l.nome] = totalVotes;
      });
    } else {
      liste.liste.forEach(l => {
        const votes = l.sezioni?.[sectionId.toString()] || 0;
        if (votes > 0) results[l.nome] = votes;
      });
    }
    return Object.keys(results).length > 0 ? results : null;
  };

  const sectionId = selectedSection;
  const ballottaggioData = sectionId === GLOBAL_SECTION_ID
    ? getGlobalBallottaggioData()
    : sectionId === CONSOLIDATED_SECTION_ID
      ? getConsolidatedBallottaggioData()
      : sectionId && ballottaggio ? ballottaggio.sezioni?.[sectionId.toString()] : null;

  const primoTurnoData = sectionId === GLOBAL_SECTION_ID || sectionId === CONSOLIDATED_SECTION_ID
    ? null
    : sectionId && primoTurno ? primoTurno.sezioni?.[sectionId.toString()] : null;

  const listeData = sectionId !== undefined ? (getSectionListeData(sectionId) || getSectionListeFromArray(sectionId)) : null;
  const preferenzeData = sectionId !== undefined ? getSectionPreferenzeData(sectionId) : null;
  const nominaliData = sectionId !== undefined ? getSectionNominaliData(sectionId) : null;
  const votantiData = sectionId !== undefined ? getSectionVotantiData(sectionId) : null;

  // Determine which section colors to show (based on ballottaggio winner if available)
  const getSectionColor = (secId: number) => {
    if (ballottaggio?.sezioni?.[secId.toString()]) {
      const section = ballottaggio.sezioni?.[secId.toString()];
      const winner = Object.entries(section.voti).reduce((a, b) => a[1] > b[1] ? a : b)[0];
      const isFirst = winner === ballottaggio.candidati[0].nome;
      return isFirst ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <Header
        title={`Analisi Sezioni - ${config.label}`}
        subtitle="Esplora i dati elettorali per sezione"
      />
      <div className="p-4 md:p-6">
        {/* Density Controls */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <h3 className="text-sm font-semibold mb-3 text-gray-700">Visualizza Densità Voto</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={() => { setDensityMode('none'); setSelectedParty(''); setSelectedCandidate(''); }}
              className={`px-3 py-1.5 text-xs rounded-full transition-colors ${densityMode === 'none' ? 'bg-gray-800 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              Nessuna
            </button>
            {(hasListe || hasPreferenze) && (
              <button
                onClick={() => { setDensityMode('party'); setSelectedCandidate(''); }}
                className={`px-3 py-1.5 text-xs rounded-full transition-colors ${densityMode === 'party' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                Per Lista
              </button>
            )}
            {(hasPreferenze || hasNominali) && (
              <button
                onClick={() => { setDensityMode('candidate'); setSelectedParty(''); }}
                className={`px-3 py-1.5 text-xs rounded-full transition-colors ${densityMode === 'candidate' ? 'bg-purple-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                Per Candidato
              </button>
            )}
            {hasBallottaggio && (
              <button
                onClick={() => { setDensityMode('ballottaggio'); setSelectedParty(''); }}
                className={`px-3 py-1.5 text-xs rounded-full transition-colors ${densityMode === 'ballottaggio' ? 'bg-red-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                Ballottaggio
              </button>
            )}
          </div>

          {densityMode === 'party' && (
            <select
              value={selectedParty}
              onChange={(e) => setSelectedParty(e.target.value)}
              className="w-full md:w-auto px-3 py-2 text-sm border rounded-lg"
            >
              <option value="">Seleziona Lista...</option>
              {partyList.map(party => (
                <option key={party} value={party}>{party}</option>
              ))}
            </select>
          )}

          {densityMode === 'candidate' && (
            <select
              value={selectedCandidate}
              onChange={(e) => setSelectedCandidate(e.target.value)}
              className="w-full md:w-auto px-3 py-2 text-sm border rounded-lg"
            >
              <option value="">Seleziona Candidato...</option>
              {candidateList.map(c => (
                <option key={`${c.party}-${c.name}`} value={c.name}>
                  {c.name} ({c.party}) - {c.total} voti
                </option>
              ))}
            </select>
          )}

          {densityMode === 'ballottaggio' && hasBallottaggio && (
            <select
              value={selectedCandidate}
              onChange={(e) => setSelectedCandidate(e.target.value)}
              className="w-full md:w-auto px-3 py-2 text-sm border rounded-lg"
            >
              <option value="">Seleziona Candidato Sindaco...</option>
              {ballottaggioCandidates.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Section selector grid */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <h3 className="text-sm font-semibold mb-3 text-gray-700">Seleziona Sezione</h3>
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-13 gap-1.5">
            <button
              onClick={() => { setSelectedSection(GLOBAL_SECTION_ID); setSectionSearch(''); }}
              className={`p-1.5 md:p-2 rounded-lg text-center text-xs md:text-sm font-medium bg-green-100 text-green-800 transition-colors ${
                selectedSection === GLOBAL_SECTION_ID ? 'ring-2 ring-offset-1 ring-green-500' : ''
              }`}
            >
              Tutti
            </button>
            {allSections.map((secId) => (
              <button
                key={secId}
                onClick={() => { setSelectedSection(secId); setSectionSearch(''); }}
                className={`p-1.5 md:p-2 rounded-lg text-center text-xs md:text-sm font-medium transition-colors ${
                  selectedSection === secId ? 'ring-2 ring-offset-1 ring-blue-500' : ''
                } ${getSectionColor(secId)}`}
              >
                {secId}
              </button>
            ))}
            <button
              onClick={() => { setSelectedSection(CONSOLIDATED_SECTION_ID); setSectionSearch(''); }}
              className={`p-1.5 md:p-2 rounded-lg text-center text-xs md:text-sm font-medium bg-amber-100 text-amber-800 transition-colors ${
                selectedSection === CONSOLIDATED_SECTION_ID ? 'ring-2 ring-offset-1 ring-amber-500' : ''
              }`}
            >
              53*
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            * Sezione 53 (Centro): consolida {CONSOLIDATED_SECTIONS.join(', ')}
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Map */}
          <SectionMap
            selectedSection={selectedSection}
            onSectionClick={(secId) => { setSelectedSection(secId); setSectionSearch(''); }}
            highlightedSections={selectedSection === CONSOLIDATED_SECTION_ID ? [...CONSOLIDATED_SECTIONS] : []}
            densityData={densityData}
            densityColor={getDensityColor()}
            showLegend={densityMode !== 'none' && (!!selectedParty || !!selectedCandidate)}
            legendLabel={densityMode === 'party' ? selectedParty : selectedCandidate}
          />

          {/* Section Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 overflow-auto max-h-[600px]">
            {sectionId !== undefined ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    {sectionId === GLOBAL_SECTION_ID
                      ? 'Risultato Globale'
                      : sectionId === CONSOLIDATED_SECTION_ID
                        ? `Sezione ${CONSOLIDATED_SECTION_ID} (Centro)`
                        : `Sezione ${sectionId}`}
                  </h3>
                  {sectionId === GLOBAL_SECTION_ID && (
                    <div className="mt-1 p-2 bg-green-50 rounded text-xs text-green-800">
                      Somma di tutte le sezioni
                    </div>
                  )}
                  {sectionId === CONSOLIDATED_SECTION_ID && (
                    <div className="mt-1 p-2 bg-amber-50 rounded text-xs text-amber-800">
                      Consolida: {CONSOLIDATED_SECTIONS.join(', ')}
                    </div>
                  )}
                </div>

                {/* Search input */}
                <div className="relative">
                  <input
                    type="text"
                    value={sectionSearch}
                    onChange={(e) => setSectionSearch(e.target.value)}
                    placeholder="Cerca candidato o lista..."
                    className="w-full px-3 py-2 pl-9 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {sectionSearch && (
                    <button
                      onClick={() => setSectionSearch('')}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Affluenza (from ballottaggio or votanti) */}
                {ballottaggioData && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Affluenza</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 bg-blue-50 rounded text-center">
                        <div className="font-bold text-blue-700">
                          {((ballottaggioData.affluenza?.aventi_diritto_donne || 0) + (ballottaggioData.affluenza?.aventi_diritto_uomini || 0)).toLocaleString('it-IT')}
                        </div>
                        <div className="text-xs text-blue-600">Aventi Diritto</div>
                      </div>
                      <div className="p-2 bg-green-50 rounded text-center">
                        <div className="font-bold text-green-700">
                          {((ballottaggioData.affluenza?.votanti_donne || 0) + (ballottaggioData.affluenza?.votanti_uomini || 0)).toLocaleString('it-IT')}
                        </div>
                        <div className="text-xs text-green-600">Votanti</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Votanti data (for regionali) */}
                {!ballottaggioData && votantiData && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Elettori</h4>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="p-2 bg-blue-50 rounded text-center">
                        <div className="font-bold text-blue-700">{votantiData.uomini.toLocaleString('it-IT')}</div>
                        <div className="text-xs text-blue-600">Uomini</div>
                      </div>
                      <div className="p-2 bg-pink-50 rounded text-center">
                        <div className="font-bold text-pink-700">{votantiData.donne.toLocaleString('it-IT')}</div>
                        <div className="text-xs text-pink-600">Donne</div>
                      </div>
                      <div className="p-2 bg-green-50 rounded text-center">
                        <div className="font-bold text-green-700">{votantiData.totale.toLocaleString('it-IT')}</div>
                        <div className="text-xs text-green-600">Totale</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Ballottaggio */}
                {ballottaggioData && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">
                      Ballottaggio Sindaco
                      {archive && electionConfig && (
                        <span className="ml-2 text-xs font-normal text-blue-500">(clicca per trend)</span>
                      )}
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(ballottaggioData.voti)
                        .sort(([, a], [, b]) => b - a)
                        .map(([name, votes], idx) => {
                          const total = Object.values(ballottaggioData.voti).reduce((a, b) => a + b, 0);
                          const pct = ((votes / total) * 100).toFixed(1);
                          return (
                            <div
                              key={name}
                              className={archive && electionConfig ? 'cursor-pointer hover:bg-blue-50 rounded p-1 -m-1 transition-colors' : ''}
                              onClick={() => handleCandidateClick(name)}
                            >
                              <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium truncate">{name}</span>
                                <span className="ml-2">{votes.toLocaleString('it-IT')} ({pct}%)</span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div className={`h-full ${idx === 0 ? 'bg-blue-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Primo Turno */}
                {primoTurnoData && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">
                      Primo Turno Sindaco
                      {archive && electionConfig && (
                        <span className="ml-2 text-xs font-normal text-blue-500">(clicca per trend)</span>
                      )}
                    </h4>
                    <div className="space-y-1">
                      {Object.entries(primoTurnoData.voti)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([name, votes]) => {
                          const total = Object.values(primoTurnoData.voti).reduce((a, b) => a + b, 0);
                          const pct = ((votes / total) * 100).toFixed(1);
                          return (
                            <div
                              key={name}
                              className={`flex justify-between text-sm ${archive && electionConfig ? 'cursor-pointer hover:bg-blue-50 rounded px-1 -mx-1 transition-colors' : ''}`}
                              onClick={() => handleCandidateClick(name)}
                            >
                              <span className="truncate">{name}</span>
                              <span className="ml-2 text-gray-600">{votes} ({pct}%)</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Liste */}
                {listeData && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">
                      Liste
                      {archive && electionConfig && (
                        <span className="ml-2 text-xs font-normal text-blue-500">(clicca per trend)</span>
                      )}
                    </h4>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {(() => {
                        const searchLower = sectionSearch.toLowerCase();
                        const sortedEntries = Object.entries(listeData).sort(([, a], [, b]) => b - a);
                        const filteredEntries = sectionSearch
                          ? sortedEntries.filter(([name]) => name.toLowerCase().includes(searchLower))
                          : sortedEntries.slice(0, 10);
                        return filteredEntries.map(([name, votes]) => {
                          const originalIdx = sortedEntries.findIndex(([n]) => n === name);
                          return (
                            <div
                              key={name}
                              className={`flex justify-between text-sm ${archive && electionConfig ? 'cursor-pointer hover:bg-blue-50 rounded px-1 -mx-1 transition-colors' : ''}`}
                              onClick={() => handlePartyClick(name)}
                            >
                              <span className="truncate flex items-center gap-1">
                                <span className={`w-4 h-4 flex items-center justify-center rounded-full text-xs ${originalIdx < 3 ? 'bg-amber-500 text-white' : 'bg-gray-200'}`}>
                                  {originalIdx + 1}
                                </span>
                                <span className="truncate">{name}</span>
                              </span>
                              <span className="ml-2 font-medium text-gray-700">{votes}</span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}

                {/* Preferenze */}
                {preferenzeData && preferenzeData.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">
                      {sectionSearch ? 'Preferenze' : 'Top Preferenze'}
                      {archive && electionConfig && (
                        <span className="ml-2 text-xs font-normal text-blue-500">(clicca per trend)</span>
                      )}
                    </h4>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {(() => {
                        const searchLower = sectionSearch.toLowerCase();
                        const filteredData = sectionSearch
                          ? preferenzeData.filter(item =>
                              item.candidate.toLowerCase().includes(searchLower) ||
                              item.party.toLowerCase().includes(searchLower)
                            )
                          : preferenzeData.slice(0, 10);
                        return filteredData.map((item) => {
                          const originalIdx = preferenzeData.findIndex(
                            p => p.candidate === item.candidate && p.party === item.party
                          );
                          return (
                            <div
                              key={`${item.party}-${item.candidate}`}
                              className={`flex justify-between text-sm ${archive && electionConfig ? 'cursor-pointer hover:bg-blue-50 rounded px-1 -mx-1 transition-colors' : ''}`}
                              onClick={() => handleCandidateClick(item.candidate, item.party)}
                            >
                              <span className="truncate flex items-center gap-1">
                                <span className={`w-4 h-4 flex items-center justify-center rounded-full text-xs ${originalIdx < 3 ? 'bg-amber-500 text-white' : 'bg-gray-200'}`}>
                                  {originalIdx + 1}
                                </span>
                                <span className="truncate" title={`${item.candidate} (${item.party})`}>
                                  {item.candidate}
                                  {sectionSearch && <span className="text-gray-400 text-xs ml-1">({item.party})</span>}
                                </span>
                              </span>
                              <span className="ml-2 font-medium text-blue-600">{item.votes}</span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}

                {/* Nominali (Uninominale) */}
                {nominaliData && nominaliData.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">
                      Candidati Uninominale
                      {archive && electionConfig && (
                        <span className="ml-2 text-xs font-normal text-blue-500">(clicca per trend)</span>
                      )}
                    </h4>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {(() => {
                        const searchLower = sectionSearch.toLowerCase();
                        const filteredData = sectionSearch
                          ? nominaliData.filter(item => item.candidate.toLowerCase().includes(searchLower))
                          : nominaliData.slice(0, 10);
                        return filteredData.map((item) => {
                          const originalIdx = nominaliData.findIndex(n => n.candidate === item.candidate);
                          return (
                            <div
                              key={item.candidate}
                              className={`flex justify-between text-sm ${archive && electionConfig ? 'cursor-pointer hover:bg-blue-50 rounded px-1 -mx-1 transition-colors' : ''}`}
                              onClick={() => handleCandidateClick(item.candidate)}
                            >
                              <span className="truncate flex items-center gap-1">
                                <span className={`w-4 h-4 flex items-center justify-center rounded-full text-xs ${originalIdx < 3 ? 'bg-amber-500 text-white' : 'bg-gray-200'}`}>
                                  {originalIdx + 1}
                                </span>
                                <span className="truncate">{item.candidate}</span>
                              </span>
                              <span className="ml-2 font-medium text-purple-600">{item.votes}</span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                Seleziona una sezione per vedere i dettagli
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Time Series Modal */}
      {archive && electionConfig && (
        <TimeSeriesModal
          isOpen={timeSeriesOpen}
          onClose={() => setTimeSeriesOpen(false)}
          archive={archive}
          currentElectionType={electionConfig.type}
          selectedItem={timeSeriesItem}
          sectionId={selectedSection === GLOBAL_SECTION_ID ? undefined : selectedSection}
          availableSections={[GLOBAL_SECTION_ID, ...allSections, CONSOLIDATED_SECTION_ID]}
          onSectionChange={(newSection) => setSelectedSection(newSection)}
        />
      )}
    </div>
  );
}
