# Ascoli Piceno Election Visualization App

## Project Overview

A web-based interactive visualization app for exploring Ascoli Piceno elections data across multiple years (2009-2025). The app displays results from Municipal (Comunali), European (Europee), Regional (Regionali), and Political (Politiche) elections with drill-down capabilities by polling section and density map visualizations.

---

## Data Available

### Location: `data/json/`

Elections are organized by year and type:
- `2009_Comunali/` - Municipal elections 2009
- `2009_Europee/` - European elections 2009
- `2010_Regionali/` - Regional elections 2010
- `2014_Comunali/` - Municipal elections 2014
- `2018_Politiche/` - Political elections 2018
- `2019/` - Municipal elections 2019
- `2019/Europee/` - European elections 2019
- `2020_Regionali/` - Regional elections 2020
- `2022_Politiche/` - Political elections 2022
- `2024_Comunali/` - Municipal elections 2024
- `2025/Regionali/` - Regional elections 2025

---

## JSON Data Structures (Required for Scraping)

**IMPORTANT**: When scraping new election data, the JSON files MUST follow these exact structures for the app to work correctly. The density map feature requires per-section vote data.

### 1. MayoralElection (Sindaco/Presidente)

Used for: `primo_turno_sindaco.json`, `ballottaggio_sindaco.json`, `presidente.json`

```json
{
  "elezione": "Comunali 2024",
  "turno": "Primo Turno",
  "data": "8-9 Giugno 2024",
  "comune": "Ascoli Piceno",
  "tipo": "Comunali",
  "descrizione": "Elezione del Sindaco",
  "sezioni_scrutinate": 52,
  "candidati": [
    {
      "nome": "CANDIDATE NAME",
      "totale": 14700,
      "percentuale": 45.5,
      "sezioni": { "1": 189, "2": 220, "52": 180 }
    }
  ],
  "affluenza": {
    "aventi_diritto_donne": 22502,
    "aventi_diritto_uomini": 20700,
    "votanti_donne": 14963,
    "votanti_uomini": 14696,
    "schede_bianche": 322,
    "schede_nulle": 357
  },
  "sezioni": {
    "1": {
      "affluenza": { ... },
      "voti": { "CANDIDATE A": 189, "CANDIDATE B": 180 }
    }
  }
}
```

### 2. PreferenzeElection (Candidate Preferences)

Used for: `preferenze_comunali.json`, `preferenze_europee.json`, `preferenze_regionali.json`

**CRITICAL**: Each candidate MUST have a `sezioni` object with votes per section for the density map to work.

```json
{
  "elezione": "Regionali",
  "turno": "primo turno",
  "data": "28-29 Settembre 2025",
  "comune": "Ascoli Piceno",
  "tipo": "Regionali",
  "descrizione": "Elezioni del Consiglio Regionale - Preferenze",
  "liste": [
    {
      "nome": "PARTY NAME",
      "candidati": [
        {
          "nome": "CANDIDATE NAME",
          "totale": 4654,
          "sezioni": { "1": 67, "2": 143, "3": 174, "52": 76 }
        }
      ]
    }
  ]
}
```

### 3. ListeElection (Party List Results)

Used for: `liste_consiglio.json`, `liste_europee.json`, `liste_camera.json`

**CRITICAL**: Each party MUST have a `sezioni` object with votes per section for the density map to work.

```json
{
  "elezione": "Comunali",
  "turno": "primo turno",
  "data": "8-9 Giugno 2024",
  "comune": "Ascoli Piceno",
  "tipo": "Comunali",
  "liste": [
    {
      "nome": "PARTY NAME",
      "totale": 7498,
      "sezioni": { "1": 99, "2": 143, "3": 174, "52": 76 }
    }
  ],
  "affluenza": { ... }
}
```

### 4. CoalizioniData (Coalition Results for Regionali)

Used for: `coalizioni_sezioni.json`

**CRITICAL**: This structure requires BOTH `coalizioni` AND `liste` arrays. The `liste` array is used by ListeRegionaliView for the density map.

```json
{
  "elezione": "Regionali",
  "turno": "primo turno",
  "data": "28-29 Settembre 2025",
  "comune": "Ascoli Piceno",
  "tipo": "Regionali",
  "descrizione": "Elezioni del Consiglio Regionale delle Marche",
  "coalizioni": [
    {
      "nome": "Centrodestra - Acquaroli",
      "candidato": "FRANCESCO ACQUAROLI",
      "liste": ["FRATELLI D'ITALIA", "LEGA", "FORZA ITALIA"],
      "totale": 12102,
      "sezioni": { "1": 153, "2": 251, "52": 130 }
    }
  ],
  "liste": [
    {
      "nome": "FRATELLI D'ITALIA",
      "totale": 7498,
      "sezioni": { "1": 99, "2": 143, "52": 76 }
    }
  ]
}
```

### 5. NominaliElection (Uninominal Candidates for Politiche)

Used for: `nominali_camera.json`, `preferenze_politiche.json`

```json
{
  "elezione": "Politiche",
  "tipo": "Camera",
  "data": "25 Settembre 2022",
  "comune": "Ascoli Piceno",
  "collegio": "Marche - U04",
  "candidati": [
    {
      "nome": "CANDIDATE NAME",
      "totale": 5000,
      "sezioni": { "1": 100, "2": 120, "52": 80 }
    }
  ]
}
```

### 6. VotantiData (Voter Turnout)

Used for: `votanti.json`

```json
{
  "elezione": "Regionali",
  "data": "28-29 Marzo 2010",
  "comune": "Ascoli Piceno",
  "tipo": "Regionali",
  "descrizione": "Affluenza alle urne",
  "sezioni": [
    { "numero": 1, "uomini": 290, "donne": 300, "totale": 590 }
  ],
  "totale_comune": { "uomini": 14696, "donne": 14963, "totale": 29659 }
}
```

---

## Key Rules for Scraping

1. **Section IDs are strings**: Always use "1", "2", etc. as keys, not integers
2. **52 sections total**: Ascoli Piceno has sections 1-52
3. **Per-section data is REQUIRED**: The density map feature requires sezioni objects with vote counts per section
4. **Empty sezioni = broken density map**: If you scrape only totals without per-section data, the density map will not work
5. **Candidate names in UPPERCASE**: Follow the convention of uppercase names
6. **Italian date format**: Use "8-9 Giugno 2024" format for dates

---

## Scraping Workflow

When scraping a new election:

1. **Identify data sources**: Usually eligo.comune.ap.it or similar
2. **Scrape ALL 52 sections**: Do not just get totals - get per-section data
3. **Structure according to types above**: Match the exact JSON structure
4. **Store in data/json/YEAR_TYPE/**: Follow naming convention
5. **Copy to app/public/data/YEAR_TYPE/**: For the web app
6. **Add loaders in dataLoader.ts**: Create load functions
7. **Add config in elections.ts**: Register the election
8. **Test locally before deploying**: Run npm run dev and verify

---

## Key Italian Terms

| Italian | English | Context |
|---------|---------|---------|
| Elezioni Comunali | Municipal Elections | Local government |
| Elezioni Europee | European Elections | EU Parliament |
| Elezioni Regionali | Regional Elections | Regional council |
| Elezioni Politiche | Political Elections | National parliament |
| Sindaco | Mayor | Head of municipality |
| Presidente | President | Regional president |
| Ballottaggio | Runoff | Second round voting |
| Primo Turno | First Round | Initial voting |
| Preferenze | Preferences | Candidate preference votes |
| Sezione | Polling Section | Voting location (52 total) |
| Affluenza | Turnout | Voter participation |
| Lista | List/Party | Political party list |
| Coalizione | Coalition | Group of allied parties |

---

## Commands

```bash
cd app
npm install                   # Install deps
npm run dev                   # Dev server (http://localhost:5173)
npm run build                 # Production build
npx vercel --prod             # Deploy to Vercel
```

---

## Notes

- 52 polling sections in Ascoli Piceno
- Elections span from 2009 to 2025
- Candidate names are in UPPERCASE
- All vote counts are integers
- Section numbers are strings ("1" to "52")
- Density map requires per-section data in sezioni objects
