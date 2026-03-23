import type { ElectionConfig, MenuItem } from '../types/elections';

const comunaliMenuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'ballottaggio', label: 'Ballottaggio', icon: '🗳️' },
  { id: 'primo-turno', label: 'Primo Turno', icon: '👤' },
  { id: 'liste', label: 'Liste Consiglio', icon: '📋' },
  { id: 'preferenze', label: 'Preferenze', icon: '⭐' },
  { id: 'sezioni', label: 'Analisi Sezioni', icon: '🗺️' },
];

const comunali2024MenuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'primo-turno', label: 'Sindaco', icon: '👤' },
  { id: 'liste', label: 'Liste Consiglio', icon: '📋' },
  { id: 'preferenze', label: 'Preferenze', icon: '⭐' },
  { id: 'sezioni', label: 'Analisi Sezioni', icon: '🗺️' },
];

const comunali2014MenuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'primo-turno', label: 'Sindaco', icon: '👤' },
  { id: 'liste', label: 'Liste Consiglio', icon: '📋' },
  { id: 'preferenze', label: 'Preferenze', icon: '⭐' },
  { id: 'sezioni', label: 'Analisi Sezioni', icon: '🗺️' },
];

const europeeMenuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'liste', label: 'Liste Europee', icon: '📋' },
  { id: 'preferenze', label: 'Preferenze', icon: '⭐' },
  { id: 'sezioni', label: 'Analisi Sezioni', icon: '🗺️' },
];

const regionaliMenuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'presidente', label: 'Presidente', icon: '👤' },
  { id: 'liste', label: 'Liste', icon: '📋' },
  { id: 'preferenze', label: 'Preferenze', icon: '⭐' },
  { id: 'sezioni', label: 'Analisi Sezioni', icon: '🗺️' },
];

const politicheMenuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'nominali', label: 'Uninominale', icon: '👤' },
  { id: 'liste', label: 'Liste Proporzionale', icon: '📋' },
  { id: 'sezioni', label: 'Analisi Sezioni', icon: '🗺️' },
];

const referendumMenuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'referendum', label: 'Risultati', icon: '🗳️' },
  { id: 'sezioni', label: 'Analisi Sezioni', icon: '🗺️' },
];

export const ELECTION_CONFIGS: ElectionConfig[] = [
  {
    id: 'referendum-2026',
    year: 2026,
    type: 'referendum',
    label: 'Referendum 2026',
    description: 'Referendum Confermativo - Ordinamento giurisdizionale',
    icon: '⚖️',
    dataPath: '2026_Referendum',
    menuItems: referendumMenuItems,
  },
  {
    id: 'regionali-2025',
    year: 2025,
    type: 'regionali',
    label: 'Regionali 2025',
    description: 'Elezioni del Consiglio Regionale delle Marche',
    icon: '🏔️',
    dataPath: '2025_Regionali',
    menuItems: regionaliMenuItems,
  },
  {
    id: 'comunali-2024',
    year: 2024,
    type: 'comunali',
    label: 'Comunali 2024',
    description: 'Elezioni del Sindaco e Consiglio Comunale',
    icon: '🏛️',
    dataPath: '2024_Comunali',
    menuItems: comunali2024MenuItems,
  },
  {
    id: 'comunali-2019',
    year: 2019,
    type: 'comunali',
    label: 'Comunali 2019',
    description: 'Elezioni del Sindaco e Consiglio Comunale',
    icon: '🏛️',
    dataPath: '2019',
    menuItems: comunaliMenuItems,
  },
  {
    id: 'comunali-2014',
    year: 2014,
    type: 'comunali',
    label: 'Comunali 2014',
    description: 'Elezioni del Sindaco e Consiglio Comunale',
    icon: '🏛️',
    dataPath: '2014',
    menuItems: comunali2014MenuItems,
  },
  {
    id: 'comunali-2009',
    year: 2009,
    type: 'comunali',
    label: 'Comunali 2009',
    description: 'Elezioni del Sindaco e Consiglio Comunale',
    icon: '🏛️',
    dataPath: '2009_Comunali',
    menuItems: comunaliMenuItems,
  },
  {
    id: 'politiche-2022',
    year: 2022,
    type: 'politiche',
    label: 'Politiche 2022',
    description: 'Elezioni della Camera dei Deputati',
    icon: '🏛️',
    dataPath: '2022_Politiche',
    menuItems: politicheMenuItems,
  },
  {
    id: 'politiche-2018',
    year: 2018,
    type: 'politiche',
    label: 'Politiche 2018',
    description: 'Elezioni della Camera dei Deputati',
    icon: '🏛️',
    dataPath: '2018_Politiche',
    menuItems: politicheMenuItems,
  },
  {
    id: 'europee-2019',
    year: 2019,
    type: 'europee',
    label: 'Europee 2019',
    description: 'Elezioni del Parlamento Europeo',
    icon: '🇪🇺',
    dataPath: '2019/Europee',
    menuItems: europeeMenuItems,
  },
  {
    id: 'europee-2009',
    year: 2009,
    type: 'europee',
    label: 'Europee 2009',
    description: 'Elezioni del Parlamento Europeo',
    icon: '🇪🇺',
    dataPath: '2009_Europee',
    menuItems: europeeMenuItems,
  },
  {
    id: 'regionali-2020',
    year: 2020,
    type: 'regionali',
    label: 'Regionali 2020',
    description: 'Elezioni del Consiglio Regionale delle Marche',
    icon: '🏔️',
    dataPath: '2020_Regionali',
    menuItems: regionaliMenuItems,
  },
  {
    id: 'regionali-2010',
    year: 2010,
    type: 'regionali',
    label: 'Regionali 2010',
    description: 'Elezioni del Consiglio Regionale delle Marche',
    icon: '🏔️',
    dataPath: '2010_Regionali',
    menuItems: regionaliMenuItems,
  },
];

export function getElectionConfig(id: string): ElectionConfig | undefined {
  return ELECTION_CONFIGS.find(c => c.id === id);
}

export function getElectionsByYear(): Map<number, ElectionConfig[]> {
  const byYear = new Map<number, ElectionConfig[]>();
  for (const config of ELECTION_CONFIGS) {
    const existing = byYear.get(config.year) || [];
    existing.push(config);
    byYear.set(config.year, existing);
  }
  return byYear;
}
