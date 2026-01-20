import type { ElectionArchive } from '../dataLoader';
import type { ElectionType } from '../../types/elections';

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
