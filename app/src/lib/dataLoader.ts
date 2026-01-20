import type { MayoralElection, PreferenzeElection, ListeElection, VotantiData, CoalizioniData, ElectionConfig, NominaliElection } from '../types/elections';

const BASE_URL = '/data';

// Generic loaders
async function loadJson<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}/${path}`);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  return response.json();
}

// 2009 Comunali specific loaders
export async function loadBallottaggio(): Promise<MayoralElection> {
  return loadJson('2009_Comunali/ballottaggio_sindaco.json');
}

export async function loadPrimoTurno(): Promise<MayoralElection> {
  return loadJson('2009_Comunali/primo_turno_sindaco.json');
}

export async function loadListeComunali(): Promise<ListeElection> {
  return loadJson('2009_Comunali/liste_consiglio.json');
}

export async function loadPreferenzeComunali(): Promise<PreferenzeElection> {
  return loadJson('2009_Comunali/preferenze_comunali.json');
}

// 2009 Europee specific loaders
export async function loadListeEuropee(): Promise<ListeElection> {
  return loadJson('2009_Comunali/europee_2009_liste.json');
}

export async function loadPreferenzeEuropee(): Promise<PreferenzeElection> {
  return loadJson('2009_Europee/preferenze_europee.json');
}

// 2024 Comunali specific loaders
export async function load2024PrimoTurno(): Promise<MayoralElection> {
  return loadJson('2024_Comunali/primo_turno_sindaco.json');
}

export async function load2024ListeComunali(): Promise<ListeElection> {
  return loadJson('2024_Comunali/liste_consiglio.json');
}

export async function load2024PreferenzeComunali(): Promise<PreferenzeElection> {
  return loadJson('2024_Comunali/preferenze_comunali.json');
}

// 2014 Comunali specific loaders
export async function load2014PrimoTurno(): Promise<MayoralElection> {
  return loadJson('2014_Comunali/primo_turno_sindaco.json');
}

export async function load2014ListeComunali(): Promise<ListeElection> {
  return loadJson('2014_Comunali/liste_consiglio.json');
}

export async function load2014PreferenzeComunali(): Promise<PreferenzeElection> {
  return loadJson('2014_Comunali/preferenze_comunali.json');
}

// 2019 Europee specific loaders
export async function load2019ListeEuropee(): Promise<ListeElection> {
  return loadJson('2019/Europee/liste_europee.json');
}

export async function load2019PreferenzeEuropee(): Promise<PreferenzeElection> {
  return loadJson('2019/Europee/preferenze_europee.json');
}

// 2019 Comunali specific loaders
export async function load2019Ballottaggio(): Promise<MayoralElection> {
  return loadJson('2019/ballottaggio_sindaco.json');
}

export async function load2019PrimoTurno(): Promise<MayoralElection> {
  return loadJson('2019/sindaco.json');
}

export async function load2019ListeComunali(): Promise<ListeElection> {
  return loadJson('2019/liste_consiglio.json');
}

export async function load2019PreferenzeComunali(): Promise<PreferenzeElection> {
  return loadJson('2019/preferenze_comunali.json');
}

// 2010 Regionali specific loaders
export async function loadPreferenzeRegionali(): Promise<PreferenzeElection> {
  return loadJson('2010_Regionali/preferenze_regionali.json');
}

export async function loadVotantiRegionali(): Promise<VotantiData> {
  return loadJson('2010_Regionali/votanti.json');
}

export async function loadCoalizioniRegionali(): Promise<CoalizioniData> {
  return loadJson('2010_Regionali/coalizioni_sezioni.json');
}

// 2020 Regionali specific loaders
export async function load2020PreferenzeRegionali(): Promise<PreferenzeElection> {
  return loadJson('2020_Regionali/preferenze_regionali.json');
}

export async function load2020CoalizioniRegionali(): Promise<CoalizioniData> {
  return loadJson('2020_Regionali/coalizioni_sezioni.json');
}

// 2025 Regionali specific loaders
export async function load2025PreferenzeRegionali(): Promise<PreferenzeElection> {
  return loadJson('2025_Regionali/preferenze_regionali.json');
}

export async function load2025CoalizioniRegionali(): Promise<CoalizioniData> {
  return loadJson('2025_Regionali/coalizioni_sezioni.json');
}

export async function load2025ListeRegionali(): Promise<ListeElection> {
  return loadJson('2025_Regionali/liste.json');
}

export async function load2025PresidenteRegionali(): Promise<MayoralElection> {
  return loadJson('2025_Regionali/presidente.json');
}

// 2018 Politiche specific loaders
export async function load2018NominaliCamera(): Promise<NominaliElection> {
  return loadJson('2018_Politiche/nominali_camera.json');
}

export async function load2018ListeCamera(): Promise<ListeElection> {
  return loadJson('2018_Politiche/liste_camera.json');
}

// 2022 Politiche specific loaders
export async function load2022NominaliPolitiche(): Promise<NominaliElection> {
  return loadJson('2022_Politiche/preferenze_politiche.json');
}

export async function load2022ListePolitiche(): Promise<ListeElection> {
  return loadJson('2022_Politiche/liste_politiche.json');
}

// Election-specific data structure
export interface ElectionData {
  config: ElectionConfig;
  preferenze?: PreferenzeElection;
  liste?: ListeElection;
  ballottaggio?: MayoralElection;
  primoTurno?: MayoralElection;
  votanti?: VotantiData;
  coalizioni?: CoalizioniData;
  nominali?: NominaliElection;
}

// Load data for a specific election configuration
export async function loadElectionData(config: ElectionConfig): Promise<ElectionData> {
  const data: ElectionData = { config };

  switch (config.id) {
    case 'comunali-2024':
      const [primoTurno2024, listeComunali2024, preferenzeComunali2024] = await Promise.all([
        load2024PrimoTurno(),
        load2024ListeComunali(),
        load2024PreferenzeComunali(),
      ]);
      data.primoTurno = primoTurno2024;
      data.liste = listeComunali2024;
      data.preferenze = preferenzeComunali2024;
      break;

    case 'comunali-2019':
      const [ballottaggio2019, primoTurno2019, listeComunali2019, preferenzeComunali2019] = await Promise.all([
        load2019Ballottaggio(),
        load2019PrimoTurno(),
        load2019ListeComunali(),
        load2019PreferenzeComunali(),
      ]);
      data.ballottaggio = ballottaggio2019;
      data.primoTurno = primoTurno2019;
      data.liste = listeComunali2019;
      data.preferenze = preferenzeComunali2019;
      break;

    case 'comunali-2014':
      const [primoTurno2014, listeComunali2014, preferenzeComunali2014] = await Promise.all([
        load2014PrimoTurno(),
        load2014ListeComunali(),
        load2014PreferenzeComunali(),
      ]);
      data.primoTurno = primoTurno2014;
      data.liste = listeComunali2014;
      data.preferenze = preferenzeComunali2014;
      break;

    case 'comunali-2009':
      const [ballottaggio, primoTurno, listeComunali, preferenzeComunali] = await Promise.all([
        loadBallottaggio(),
        loadPrimoTurno(),
        loadListeComunali(),
        loadPreferenzeComunali(),
      ]);
      data.ballottaggio = ballottaggio;
      data.primoTurno = primoTurno;
      data.liste = listeComunali;
      data.preferenze = preferenzeComunali;
      break;

    case 'europee-2019':
      const [listeEuropee2019, preferenzeEuropee2019] = await Promise.all([
        load2019ListeEuropee(),
        load2019PreferenzeEuropee(),
      ]);
      data.liste = listeEuropee2019;
      data.preferenze = preferenzeEuropee2019;
      break;

    case 'europee-2009':
      const [listeEuropee, preferenzeEuropee] = await Promise.all([
        loadListeEuropee(),
        loadPreferenzeEuropee(),
      ]);
      data.liste = listeEuropee;
      data.preferenze = preferenzeEuropee;
      break;

    case 'regionali-2025':
      const [preferenzeRegionali2025, coalizioniRegionali2025, listeRegionali2025, presidenteRegionali2025] = await Promise.all([
        load2025PreferenzeRegionali(),
        load2025CoalizioniRegionali(),
        load2025ListeRegionali(),
        load2025PresidenteRegionali(),
      ]);
      data.preferenze = preferenzeRegionali2025;
      data.coalizioni = coalizioniRegionali2025;
      data.liste = listeRegionali2025;
      data.primoTurno = presidenteRegionali2025;
      break;

    case 'regionali-2020':
      const [preferenzeRegionali2020, coalizioniRegionali2020] = await Promise.all([
        load2020PreferenzeRegionali(),
        load2020CoalizioniRegionali(),
      ]);
      data.preferenze = preferenzeRegionali2020;
      data.coalizioni = coalizioniRegionali2020;
      break;

    case 'regionali-2010':
      const [preferenzeRegionali, votantiRegionali, coalizioniRegionali] = await Promise.all([
        loadPreferenzeRegionali(),
        loadVotantiRegionali(),
        loadCoalizioniRegionali(),
      ]);
      data.preferenze = preferenzeRegionali;
      data.votanti = votantiRegionali;
      data.coalizioni = coalizioniRegionali;
      break;

    case 'politiche-2022':
      const [nominali2022, liste2022] = await Promise.all([
        load2022NominaliPolitiche(),
        load2022ListePolitiche(),
      ]);
      data.nominali = nominali2022;
      data.liste = liste2022;
      break;

    case 'politiche-2018':
      const [nominali2018, liste2018] = await Promise.all([
        load2018NominaliCamera(),
        load2018ListeCamera(),
      ]);
      data.nominali = nominali2018;
      data.liste = liste2018;
      break;
  }

  return data;
}

// Legacy: Load all 2009 data (for backward compatibility)
export async function loadAllData() {
  const [ballottaggio, primoTurno, listeComunali, preferenzeComunali, listeEuropee, preferenzeEuropee] =
    await Promise.all([
      loadBallottaggio(),
      loadPrimoTurno(),
      loadListeComunali(),
      loadPreferenzeComunali(),
      loadListeEuropee(),
      loadPreferenzeEuropee(),
    ]);

  return {
    ballottaggio,
    primoTurno,
    listeComunali,
    preferenzeComunali,
    listeEuropee,
    preferenzeEuropee,
  };
}

export type AllElectionData = Awaited<ReturnType<typeof loadAllData>>;

// Election Archive - all elections across all years
export interface ElectionArchive {
  elections: Record<string, ElectionData>;
  summary: {
    totalElections: number;
    years: number[];
    types: string[];
    lastUpdated: string;
  };
}

const ALL_ELECTION_CONFIGS: Array<{ id: string; year: number; type: string }> = [
  { id: 'regionali-2025', year: 2025, type: 'regionali' },
  { id: 'comunali-2024', year: 2024, type: 'comunali' },
  { id: 'comunali-2019', year: 2019, type: 'comunali' },
  { id: 'comunali-2014', year: 2014, type: 'comunali' },
  { id: 'comunali-2009', year: 2009, type: 'comunali' },
  { id: 'europee-2019', year: 2019, type: 'europee' },
  { id: 'europee-2009', year: 2009, type: 'europee' },
  { id: 'regionali-2020', year: 2020, type: 'regionali' },
  { id: 'regionali-2010', year: 2010, type: 'regionali' },
  { id: 'politiche-2022', year: 2022, type: 'politiche' },
  { id: 'politiche-2018', year: 2018, type: 'politiche' },
];

export async function loadElectionArchive(): Promise<ElectionArchive> {
  const elections: Record<string, ElectionData> = {};
  const loadPromises: Array<Promise<void>> = [];

  for (const cfg of ALL_ELECTION_CONFIGS) {
    const config: ElectionConfig = {
      id: cfg.id,
      year: cfg.year,
      type: cfg.type as ElectionConfig['type'],
      label: `${cfg.type} ${cfg.year}`,
      description: '',
      icon: '',
      dataPath: '',
      menuItems: [],
    };

    loadPromises.push(
      loadElectionData(config)
        .then(data => { elections[cfg.id] = data; })
        .catch(err => console.warn(`Failed to load ${cfg.id}:`, err))
    );
  }

  await Promise.all(loadPromises);

  const years = [...new Set(ALL_ELECTION_CONFIGS.map(c => c.year))].sort();
  const types = [...new Set(ALL_ELECTION_CONFIGS.map(c => c.type))];

  return {
    elections,
    summary: {
      totalElections: Object.keys(elections).length,
      years,
      types,
      lastUpdated: new Date().toISOString(),
    },
  };
}
