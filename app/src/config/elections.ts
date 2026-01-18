import type { ElectionConfig, MenuItem } from '../types/elections';

const comunaliMenuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'ballottaggio', label: 'Ballottaggio', icon: '🗳️' },
  { id: 'primo-turno', label: 'Primo Turno', icon: '👤' },
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

export const ELECTION_CONFIGS: ElectionConfig[] = [
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
