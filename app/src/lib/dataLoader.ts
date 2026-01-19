import type { MayoralElection, PreferenzeElection, ListeElection, VotantiData, CoalizioniData, ElectionConfig } from '../types/elections';

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

// Election-specific data structure
export interface ElectionData {
  config: ElectionConfig;
  preferenze?: PreferenzeElection;
  liste?: ListeElection;
  ballottaggio?: MayoralElection;
  primoTurno?: MayoralElection;
  votanti?: VotantiData;
  coalizioni?: CoalizioniData;
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

    case 'europee-2009':
      const [listeEuropee, preferenzeEuropee] = await Promise.all([
        loadListeEuropee(),
        loadPreferenzeEuropee(),
      ]);
      data.liste = listeEuropee;
      data.preferenze = preferenzeEuropee;
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
