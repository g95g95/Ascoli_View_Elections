import type { ElectionArchive } from '../dataLoader';
import type { ElectionType } from '../../types/elections';

// Mapping delle sezioni elettorali di Ascoli Piceno (52 sezioni)
// Fonte: dati affluenza Politiche 2022
export const SECTION_MAPPING: Record<string, string> = {
  '1': 'SC. EL.S. AGOSTINO Via delle Torri, 59',
  '2': 'SC. ELEM. MALASPINA Via dei Malaspina, 2',
  '3': 'SC. ELEM. MALASPINA Via dei Malaspina, 2',
  '4': 'SC. ELEM. MALASPINA Via dei Malaspina, 2',
  '5': 'SC. ELEM. MALASPINA Via dei Malaspina, 2',
  '6': 'SC. ELEM. MALASPINA Via dei Malaspina, 2',
  '7': 'SC. MEDIA M. D\'AZEGLIO Via M. D\'Azeglio, 2',
  '8': 'SC. MEDIA M. D\'AZEGLIO Via M. D\'Azeglio, 2',
  '9': 'SC. ELEM G. RODARI Via S. Serafino da M., 1/B',
  '10': 'SC. ELEM. G. RODARI Via S. Serafino da M., 2',
  '11': 'SC. ELEM. G. RODARI Via S. Serafino da M., 2',
  '12': 'SC. MEDIA A. CECI Via S. Serafino da M., 1',
  '13': 'SC. MEDIA A. CECI Via S. Serafino da M., 1',
  '14': 'SC. MEDIA A. CECI Via S. Serafino da M., 1',
  '15': 'SC. MEDIA G. CANTALAMESSA Via Montenero, 4',
  '16': 'SC. MEDIA G. CANTALAMESSA Via Montenero, 4',
  '17': 'SC. MEDIA G. CANTALAMESSA Via Montenero, 4',
  '18': 'SC. MEDIA G. CANTALAMESSA Via N. Sauro, 20/A',
  '19': 'SC. MEDIA G. CANTALAMESSA Via N. Sauro, 20/A',
  '20': 'SC. MEDIA L. LUCIANI Via 3 Ottobre, 8/C',
  '21': 'SC. MEDIA L. LUCIANI Via 3 Ottobre, 8/C',
  '22': 'SC. ELEM. G. SPERANZA Via G. Speranza, 9',
  '23': 'SC. MEDIA L. LUCIANI Via Napoli, 39',
  '24': 'SC. ELEM. G. SPERANZA Via G. Speranza, 9',
  '25': 'SC. MEDIA L. LUCIANI Via Napoli, 39',
  '26': 'SC. MEDIA L. LUCIANI Via 3 Ottobre, 8/C',
  '27': 'SC. ELE. SS. FILIPPO e G. Via Sardegna, 8/B',
  '28': 'SC. ELE. SS. FILIPPO e G. Via Sardegna, 8/B',
  '29': 'SC. ELE. SS. FILIPPO e G. Via Sardegna, 10',
  '30': 'SC. ELE. SS. FILIPPO e G. Via Sardegna, 10',
  '31': 'Sc. Elem. Statale (Campo Parignano)',
  '32': 'Sc. Elem. Statale (Campo Parignano)',
  '33': 'Sc. Elem. Statale (Campo Parignano)',
  '34': 'Sc. Elem. Statale (Campo Parignano)',
  '35': 'Sc. Elem. Statale (Campo Parignano)',
  '36': 'SC. ELEM. MONTICELLI Via dei Gelsomini, 14',
  '37': 'SC. ELEM. MONTICELLI Viale della Liberta, 3',
  '38': 'SC. ELEM. MONTICELLI Viale della Liberta, 3',
  '39': 'SC. ELEM. MONTICELLI Viale della Liberta, 3',
  '40': 'OSP. GEN.LE C. e G. MAZZONI Via degli Iris, 6 (sezione ospedaliera)',
  '41': 'SC. EL.S. AGOSTINO Via delle Torri, 59',
  '42': 'SC. EL.S. AGOSTINO Via delle Torri, 59',
  '43': 'SC. ELEM. COMUNALE (Frazione)',
  '44': 'SC. ELEM. COMUNALE (Frazione)',
  '45': 'SC. ELEM. di VENAGRANDE',
  '46': 'Sc. Media M. D\'Azeglio L.ngo C. Sisto V, 48',
  '47': 'Sc. Media M. D\'Azeglio L.ngo C. Sisto V, 4',
  '48': 'SC. ELEM. MARINO del Tr.',
  '49': 'SC. ELEM. MONTICELLI Via dei Narcisi, 2',
  '50': 'SC. ELEM. POGGIO di BRETTA',
  '51': 'SC. ELEM. POGGIO di BRETTA',
  '52': 'Sc. Mat. Villa Sant\'Antonio Via Monte Catria, 16',
};

export interface SectionInfo {
  sectionId: string;
  location: string;
  area?: string;
}

// Get info about a polling section
export function getSectionInfo(sectionId: string | number): SectionInfo | null {
  const id = String(sectionId);
  const location = SECTION_MAPPING[id];
  if (!location) return null;

  // Extract area name from location
  let area = 'Centro';
  if (location.includes('MONTICELLI')) area = 'Monticelli';
  else if (location.includes('VENAGRANDE')) area = 'Venagrande';
  else if (location.includes('POGGIO di BRETTA')) area = 'Poggio di Bretta';
  else if (location.includes('MARINO del Tr')) area = 'Marino del Tronto';
  else if (location.includes('Villa Sant\'Antonio')) area = 'Villa Sant\'Antonio';
  else if (location.includes('Campo Parignano') || location.includes('Statale (Campo')) area = 'Campo Parignano';
  else if (location.includes('MAZZONI') || location.includes('OSP')) area = 'Ospedale Mazzoni';
  else if (location.includes('FILIPPO e G')) area = 'Centro-Ovest';
  else if (location.includes('RODARI') || location.includes('CECI')) area = 'Zona Rodari/Ceci';
  else if (location.includes('CANTALAMESSA')) area = 'Zona Cantalamessa';
  else if (location.includes('LUCIANI')) area = 'Zona Luciani';
  else if (location.includes('SPERANZA')) area = 'Zona Speranza';
  else if (location.includes('MALASPINA')) area = 'Centro Storico';
  else if (location.includes('AGOSTINO')) area = 'Centro Storico';
  else if (location.includes('D\'AZEGLIO')) area = 'Centro';

  return { sectionId: id, location, area };
}

// Get all sections in a specific area
export function getSectionsByArea(area: string): SectionInfo[] {
  const results: SectionInfo[] = [];
  for (const [id, _] of Object.entries(SECTION_MAPPING)) {
    const info = getSectionInfo(id);
    if (info && info.area?.toLowerCase().includes(area.toLowerCase())) {
      results.push(info);
    }
  }
  return results;
}

// Get a summary of all polling sections grouped by area
export function getSectionsSummary(): string {
  const byArea: Record<string, string[]> = {};

  for (const [id, _] of Object.entries(SECTION_MAPPING)) {
    const info = getSectionInfo(id);
    if (info && info.area) {
      if (!byArea[info.area]) byArea[info.area] = [];
      byArea[info.area].push(id);
    }
  }

  let summary = 'SEZIONI ELETTORALI ASCOLI PICENO (52 sezioni):\n\n';
  for (const [area, sections] of Object.entries(byArea).sort()) {
    summary += `${area}: sezioni ${sections.sort((a, b) => Number(a) - Number(b)).join(', ')}\n`;
  }

  return summary;
}

export interface TrendPoint {
  year: number;
  type: ElectionType;
  value: number;
  label?: string;
}

export interface PartyPerformance {
  partyName: string;
  trend: TrendPoint[];
  avgVotes: number;
  peakYear: number;
  peakVotes: number;
}

export interface TurnoutAnalysis {
  trend: TrendPoint[];
  avgTurnout: number;
  highestYear: number;
  lowestYear: number;
}

export interface SectionSwing {
  sectionId: string;
  party: string;
  swing: number;
  votes2009: number;
  votes2024: number;
}

export interface AnalysisResult {
  type: 'trend' | 'comparison' | 'ranking' | 'anomaly';
  title: string;
  description: string;
  data: unknown;
  suggestedChart: 'bar' | 'line' | 'pie' | 'grouped-bar' | 'heatmap';
}

// Analyze party performance across elections
export function analyzePartyTrend(archive: ElectionArchive, partyName: string): PartyPerformance | null {
  const trend: TrendPoint[] = [];
  const normalizedName = partyName.toLowerCase();

  for (const election of Object.values(archive.elections)) {
    if (!election.liste) continue;

    const party = election.liste.liste.find(l =>
      l.nome.toLowerCase().includes(normalizedName) ||
      normalizedName.includes(l.nome.toLowerCase())
    );

    if (party) {
      trend.push({
        year: election.config.year,
        type: election.config.type,
        value: party.totale,
        label: party.nome,
      });
    }
  }

  if (trend.length === 0) return null;

  trend.sort((a, b) => a.year - b.year);
  const avgVotes = Math.round(trend.reduce((s, t) => s + t.value, 0) / trend.length);
  const peak = trend.reduce((max, t) => t.value > max.value ? t : max, trend[0]);

  return {
    partyName,
    trend,
    avgVotes,
    peakYear: peak.year,
    peakVotes: peak.value,
  };
}

// Analyze turnout trends
export function analyzeTurnout(archive: ElectionArchive): TurnoutAnalysis {
  const trend: TrendPoint[] = [];

  for (const election of Object.values(archive.elections)) {
    let turnout = 0;

    if (election.ballottaggio?.affluenza) {
      const aff = election.ballottaggio.affluenza;
      const aventi = aff.aventi_diritto_donne + aff.aventi_diritto_uomini;
      const votanti = aff.votanti_donne + aff.votanti_uomini;
      turnout = aventi > 0 ? (votanti / aventi) * 100 : 0;
    } else if (election.primoTurno?.affluenza) {
      const aff = election.primoTurno.affluenza;
      const aventi = aff.aventi_diritto_donne + aff.aventi_diritto_uomini;
      const votanti = aff.votanti_donne + aff.votanti_uomini;
      turnout = aventi > 0 ? (votanti / aventi) * 100 : 0;
    } else if (election.liste?.affluenza) {
      const aff = election.liste.affluenza;
      const aventi = aff.aventi_diritto_donne + aff.aventi_diritto_uomini;
      const votanti = aff.votanti_donne + aff.votanti_uomini;
      turnout = aventi > 0 ? (votanti / aventi) * 100 : 0;
    }

    if (turnout > 0) {
      trend.push({
        year: election.config.year,
        type: election.config.type,
        value: Math.round(turnout * 10) / 10,
      });
    }
  }

  trend.sort((a, b) => a.year - b.year);
  const avgTurnout = trend.length > 0
    ? Math.round(trend.reduce((s, t) => s + t.value, 0) / trend.length * 10) / 10
    : 0;
  const highest = trend.reduce((max, t) => t.value > max.value ? t : max, trend[0] || { year: 0, value: 0 });
  const lowest = trend.reduce((min, t) => t.value < min.value ? t : min, trend[0] || { year: 0, value: 100 });

  return {
    trend,
    avgTurnout,
    highestYear: highest.year,
    lowestYear: lowest.year,
  };
}

// Get top parties across all elections
export function getTopParties(archive: ElectionArchive, limit: number = 10): Array<{ name: string; totalVotes: number; elections: number }> {
  const partyVotes: Record<string, { total: number; count: number }> = {};

  for (const election of Object.values(archive.elections)) {
    if (!election.liste) continue;

    for (const party of election.liste.liste) {
      const normalized = party.nome.toUpperCase();
      if (!partyVotes[normalized]) {
        partyVotes[normalized] = { total: 0, count: 0 };
      }
      partyVotes[normalized].total += party.totale;
      partyVotes[normalized].count++;
    }
  }

  return Object.entries(partyVotes)
    .map(([name, data]) => ({ name, totalVotes: data.total, elections: data.count }))
    .sort((a, b) => b.totalVotes - a.totalVotes)
    .slice(0, limit);
}

// Get top candidates across all elections
export function getTopCandidates(archive: ElectionArchive, limit: number = 20): Array<{ name: string; party: string; votes: number; year: number; type: string }> {
  const candidates: Array<{ name: string; party: string; votes: number; year: number; type: string }> = [];

  for (const election of Object.values(archive.elections)) {
    if (!election.preferenze) continue;

    for (const party of election.preferenze.liste) {
      for (const candidate of party.candidati) {
        candidates.push({
          name: candidate.nome,
          party: party.nome,
          votes: candidate.totale,
          year: election.config.year,
          type: election.config.type,
        });
      }
    }
  }

  return candidates.sort((a, b) => b.votes - a.votes).slice(0, limit);
}

// Search for a specific candidate by name across all elections
export function searchCandidate(archive: ElectionArchive, searchName: string): Array<{
  name: string;
  party: string;
  votes: number;
  year: number;
  type: string;
  electionLabel: string;
  sections?: Record<string, number>;
}> {
  const results: Array<{
    name: string;
    party: string;
    votes: number;
    year: number;
    type: string;
    electionLabel: string;
    sections?: Record<string, number>;
  }> = [];

  // Allow shorter terms for surname-only searches
  const searchTerms = searchName.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  // Also allow single terms with length > 3 (surnames like "Rossi", "Bonelli")
  if (searchTerms.length === 0) {
    const shortTerms = searchName.toLowerCase().split(/\s+/).filter(t => t.length > 3);
    if (shortTerms.length > 0) {
      searchTerms.push(...shortTerms);
    }
  }
  if (searchTerms.length === 0) return results;

  // For single-term searches (just surname), require only 1 match
  const minMatches = searchTerms.length === 1 ? 1 : Math.min(2, searchTerms.length);

  for (const election of Object.values(archive.elections)) {
    if (!election?.config) continue;

    if (election.preferenze?.liste) {
      for (const party of election.preferenze.liste) {
        if (!party?.candidati) continue;
        for (const candidate of party.candidati) {
          if (!candidate?.nome) continue;
          const candidateName = candidate.nome.toLowerCase();
          const matchScore = searchTerms.filter(term => candidateName.includes(term)).length;

          if (matchScore >= minMatches) {
            results.push({
              name: candidate.nome,
              party: party.nome || 'N/A',
              votes: candidate.totale ?? 0,
              year: election.config.year,
              type: election.config.type,
              electionLabel: election.config.label || `${election.config.type} ${election.config.year}`,
              sections: candidate.sezioni,
            });
          }
        }
      }
    }

    // Also search in mayoral candidates
    if (election.primoTurno?.candidati) {
      for (const candidate of election.primoTurno.candidati) {
        if (!candidate?.nome) continue;
        const candidateName = candidate.nome.toLowerCase();
        const matchScore = searchTerms.filter(term => candidateName.includes(term)).length;

        if (matchScore >= minMatches) {
          results.push({
            name: candidate.nome,
            party: 'Candidato Sindaco/Presidente',
            votes: candidate.totale ?? 0,
            year: election.config.year,
            type: election.config.type,
            electionLabel: `${election.config.label || election.config.type} - Primo Turno`,
          });
        }
      }
    }

    if (election.ballottaggio?.candidati) {
      for (const candidate of election.ballottaggio.candidati) {
        if (!candidate?.nome) continue;
        const candidateName = candidate.nome.toLowerCase();
        const matchScore = searchTerms.filter(term => candidateName.includes(term)).length;

        if (matchScore >= minMatches) {
          results.push({
            name: candidate.nome,
            party: 'Candidato Sindaco/Presidente',
            votes: candidate.totale ?? 0,
            year: election.config.year,
            type: election.config.type,
            electionLabel: `${election.config.label || election.config.type} - Ballottaggio`,
          });
        }
      }
    }

    // Search in nominali (politiche)
    if (election.nominali?.candidati) {
      for (const candidate of election.nominali.candidati) {
        if (!candidate?.nome) continue;
        const candidateName = candidate.nome.toLowerCase();
        const matchScore = searchTerms.filter(term => candidateName.includes(term)).length;

        if (matchScore >= minMatches) {
          results.push({
            name: candidate.nome,
            party: 'Uninominale',
            votes: candidate.totale ?? 0,
            year: election.config.year,
            type: election.config.type,
            electionLabel: election.config.label || `${election.config.type} ${election.config.year}`,
          });
        }
      }
    }
  }

  return results.sort((a, b) => b.year - a.year || b.votes - a.votes);
}

// Find elections by type
export function getElectionsByType(archive: ElectionArchive, type: ElectionType): string[] {
  return Object.entries(archive.elections)
    .filter(([_, e]) => e.config.type === type)
    .map(([id]) => id)
    .sort();
}

// Compare two elections
export function compareElections(archive: ElectionArchive, id1: string, id2: string): AnalysisResult | null {
  const e1 = archive.elections[id1];
  const e2 = archive.elections[id2];

  if (!e1 || !e2 || !e1.liste || !e2.liste) return null;

  const parties1 = new Map(e1.liste.liste.map(p => [p.nome.toUpperCase(), p.totale]));
  const parties2 = new Map(e2.liste.liste.map(p => [p.nome.toUpperCase(), p.totale]));

  const allParties = new Set([...parties1.keys(), ...parties2.keys()]);
  const comparison = Array.from(allParties).map(name => ({
    name,
    election1: parties1.get(name) || 0,
    election2: parties2.get(name) || 0,
    change: (parties2.get(name) || 0) - (parties1.get(name) || 0),
  })).sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

  return {
    type: 'comparison',
    title: `Confronto ${e1.config.label} vs ${e2.config.label}`,
    description: `Variazione voti tra le due elezioni`,
    data: comparison,
    suggestedChart: 'grouped-bar',
  };
}

// Generate archive summary stats
export function generateArchiveSummary(archive: ElectionArchive): string {
  const { summary, elections } = archive;

  let totalVotes = 0;
  let electionsList: string[] = [];

  for (const election of Object.values(elections)) {
    electionsList.push(`- ${election.config.label} (${election.config.year})`);

    if (election.liste) {
      totalVotes += election.liste.liste.reduce((s, p) => s + p.totale, 0);
    }
  }

  return `ARCHIVIO ELEZIONI ASCOLI PICENO
================================
Elezioni caricate: ${summary.totalElections}
Anni: ${summary.years.join(', ')}
Tipi: ${summary.types.join(', ')}

Elezioni disponibili:
${electionsList.join('\n')}

Voti totali registrati: ${totalVotes.toLocaleString('it-IT')}

Puoi chiedermi di:
- Confrontare l'affluenza tra anni diversi
- Analizzare l'andamento di un partito nel tempo
- Trovare i candidati più votati di sempre
- Confrontare due elezioni specifiche
- Analizzare le sezioni con maggiore oscillazione`;
}
