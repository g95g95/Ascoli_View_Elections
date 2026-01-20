export interface Affluenza {
  aventi_diritto_donne: number;
  aventi_diritto_uomini: number;
  votanti_donne: number;
  votanti_uomini: number;
  schede_bianche: number;
  schede_nulle: number;
}

export interface MayoralCandidate {
  nome: string;
  totale: number;
  percentuale?: number;
  sezioni?: Record<string, number>;
}

export interface SectionMayoralData {
  affluenza?: Affluenza;
  voti: Record<string, number>;
}

export interface MayoralElection {
  elezione: string;
  turno: string;
  data: string;
  comune: string;
  tipo: string;
  descrizione?: string;
  sezioni_scrutinate?: number;
  candidati: MayoralCandidate[];
  affluenza?: Affluenza;
  sezioni?: Record<string, SectionMayoralData>;
}

export interface Candidate {
  nome: string;
  totale: number;
  sezioni: Record<string, number>;
}

export interface Party {
  nome: string;
  candidati: Candidate[];
}

export interface PreferenzeElection {
  elezione: string;
  turno: string;
  data: string;
  comune: string;
  tipo: string;
  descrizione: string;
  liste: Party[];
}

export interface ListeItem {
  nome: string;
  totale: number;
  sezioni?: Record<string, number>;
}

export interface ListeElection {
  elezione: string;
  turno: string;
  data: string;
  comune: string;
  tipo: string;
  liste: ListeItem[];
  affluenza?: Affluenza;
  sezioni?: Record<string, { affluenza: Affluenza; voti: Record<string, number> }>;
}

export interface VotantiSezione {
  numero: number;
  uomini: number;
  donne: number;
  totale: number;
}

export interface VotantiData {
  elezione: string;
  data: string;
  comune: string;
  tipo: string;
  descrizione: string;
  sezioni: VotantiSezione[];
  totale_comune: {
    uomini: number;
    donne: number;
    totale: number;
  };
}

export interface CoalizioneItem {
  nome: string;
  totale: number;
  sezioni: Record<string, number>;
}

export interface CoalizioniData {
  elezione: string;
  turno: string;
  data: string;
  comune: string;
  tipo: string;
  descrizione: string;
  coalizioni: CoalizioneItem[];
  liste: CoalizioneItem[];
}

export interface NominaliCandidate {
  nome: string;
  totale: number;
  sezioni: Record<string, number>;
}

export interface NominaliElection {
  elezione: string;
  tipo: string;
  data: string;
  comune: string;
  collegio?: string;
  candidati: NominaliCandidate[];
}

export type ElectionType = 'comunali' | 'europee' | 'regionali' | 'politiche';

export type ViewType =
  | 'landing'
  | 'dashboard'
  | 'ballottaggio'
  | 'primo-turno'
  | 'liste'
  | 'preferenze'
  | 'sezioni'
  | 'presidente'
  | 'nominali';

export interface MenuItem {
  id: ViewType;
  label: string;
  icon: string;
}

export interface ElectionConfig {
  id: string;
  year: number;
  type: ElectionType;
  label: string;
  description: string;
  icon: string;
  dataPath: string;
  menuItems: MenuItem[];
}

export type ElectionContext = ElectionConfig | null;

export const CONSOLIDATED_SECTIONS = [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 15, 16, 17, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 42] as const;
export const CONSOLIDATED_SECTION_ID = 53;

export function isConsolidatedSection(sectionId: number): boolean {
  return CONSOLIDATED_SECTIONS.includes(sectionId as typeof CONSOLIDATED_SECTIONS[number]);
}

export function getDisplaySectionId(sectionId: number): number {
  return isConsolidatedSection(sectionId) ? CONSOLIDATED_SECTION_ID : sectionId;
}

// Archive types for cross-election analysis
export interface ElectionSummary {
  id: string;
  year: number;
  type: ElectionType;
  label: string;
  date: string;
  totalVotes?: number;
  turnoutPercent?: number;
  winner?: string;
  winnerVotes?: number;
}

export interface PartyTrend {
  partyName: string;
  elections: Array<{
    year: number;
    type: ElectionType;
    votes: number;
    percentage: number;
  }>;
}

export interface ArchiveStats {
  totalElections: number;
  yearsSpan: string;
  electionTypes: ElectionType[];
  totalVotesCast: number;
  partyTrends: PartyTrend[];
  turnoutTrend: Array<{ year: number; type: ElectionType; turnout: number }>;
}
