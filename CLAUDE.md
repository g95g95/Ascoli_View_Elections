# Ascoli Piceno Election Visualization App

## Project Overview

A web-based interactive visualization app for exploring the 2009 Ascoli Piceno elections data. The app displays results from both Municipal (Comunali) and European (Europee) elections with drill-down capabilities by polling section.

---

## Data Available

### Location: `data/json/`

| File | Description | Key Data |
|------|-------------|----------|
| `2009_Comunali/ballottaggio_sindaco.json` | Mayoral runoff | 2 candidates, 52 sections, affluenza |
| `2009_Comunali/primo_turno_sindaco.json` | First round mayoral | Multiple candidates, 52 sections |
| `2009_Comunali/liste_consiglio.json` | Council list results | Party votes per section |
| `2009_Comunali/preferenze_comunali.json` | Candidate preferences | 28 parties, 760 candidates, votes by section |
| `2009_Europee/preferenze_europee.json` | European preferences | 13 parties, ~180 candidates |
| `2009_Comunali/europee_2009_liste.json` | European list results | Party totals |

### Data Structure Patterns

**Mayoral Results (ballottaggio/primo_turno):**
```json
{
  "elezione": "Comunali 2009",
  "turno": "Ballottaggio",
  "data": "21-22 Giugno 2009",
  "comune": "Ascoli Piceno",
  "candidati": [{"nome": "Name", "totale": 14700}],
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
      "affluenza": {...},
      "voti": {"Candidate A": 189, "Candidate B": 180}
    }
  }
}
```

**Candidate Preferences:**
```json
{
  "elezione": "Comunali",
  "turno": "primo turno",
  "data": "2009-06-07",
  "comune": "Ascoli Piceno",
  "liste": [
    {
      "nome": "Party Name",
      "candidati": [
        {
          "nome": "SURNAME NAME",
          "totale": 123,
          "sezioni": {"1": 5, "2": 3, ... "52": 2}
        }
      ]
    }
  ]
}
```

---

## App Requirements

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts or Chart.js
- **Maps**: Leaflet (optional, for geographic visualization)
- **State**: React Context or Zustand
- **No Backend**: Static JSON files served directly

### Core Features

#### 1. Dashboard Home
- Overview cards showing key election stats
- Quick navigation to different election types
- Total voters, turnout percentage, winning candidates

#### 2. Mayoral Elections View
- **Primo Turno**: Bar chart of all candidates
- **Ballottaggio**: Head-to-head comparison
- Turnout visualization (voters vs eligible)
- Section-by-section breakdown table
- Interactive map (if geo data available)

#### 3. Council Lists View
- Party vote totals as bar/pie chart
- Comparison between Comunali and Europee
- Section heatmap showing party strength

#### 4. Candidate Preferences View
- Searchable/filterable candidate list
- Party selector dropdown
- Top candidates ranking per party
- Section-level drill-down for any candidate
- Sort by: total votes, name, section performance

#### 5. Section Analysis
- Select any of the 52 sections
- View all results for that section
- Compare sections side-by-side
- Identify strongholds per party/candidate

#### 6. Comparative Analysis
- Comunali vs Europee turnout
- Party performance across election types
- Section-level correlation analysis

### UI/UX Requirements

- **Responsive**: Works on mobile and desktop
- **Dark/Light mode**: Toggle theme
- **Italian language**: All labels in Italian
- **Print-friendly**: Export charts as PNG/PDF
- **Accessible**: ARIA labels, keyboard navigation

### Data Visualization Types

1. **Bar Charts**: Candidate/party comparisons
2. **Pie Charts**: Vote share distribution
3. **Line Charts**: Section-by-section trends
4. **Heatmaps**: Section performance grids
5. **Tables**: Detailed sortable data views
6. **Cards**: Summary statistics

---

## Project Structure (Proposed)

```
src/
├── components/
│   ├── charts/           # Reusable chart components
│   ├── layout/           # Header, Sidebar, Footer
│   └── ui/               # Buttons, Cards, Tables
├── features/
│   ├── dashboard/        # Home dashboard
│   ├── mayoral/          # Sindaco views
│   ├── council/          # Liste consiglio views
│   ├── preferences/      # Candidate preferences
│   └── sections/         # Section analysis
├── data/                 # JSON data files (copied from data/json)
├── hooks/                # Custom React hooks
├── lib/                  # Utilities, data loaders
├── types/                # TypeScript interfaces
└── App.tsx
```

---

## Development Phases

### Phase 1: Setup & Data Loading
- [ ] Initialize Vite + React + TypeScript project
- [ ] Configure Tailwind CSS
- [ ] Create data loading utilities
- [ ] Define TypeScript interfaces for all JSON structures
- [ ] Create basic layout components

### Phase 2: Dashboard & Navigation
- [ ] Build main dashboard with stats cards
- [ ] Create navigation sidebar
- [ ] Implement routing (React Router)
- [ ] Add theme toggle

### Phase 3: Mayoral Views
- [ ] Primo turno results page
- [ ] Ballottaggio results page
- [ ] Turnout visualization
- [ ] Section breakdown tables

### Phase 4: Lists & Preferences
- [ ] Council lists comparison
- [ ] Party selector component
- [ ] Candidate search/filter
- [ ] Top candidates ranking

### Phase 5: Section Analysis
- [ ] Section selector
- [ ] Section detail view
- [ ] Multi-section comparison

### Phase 6: Polish & Export
- [ ] Chart export functionality
- [ ] Print styles
- [ ] Accessibility audit
- [ ] Performance optimization

---

## Key Italian Terms

| Italian | English | Context |
|---------|---------|---------|
| Elezioni Comunali | Municipal Elections | Local government |
| Elezioni Europee | European Elections | EU Parliament |
| Sindaco | Mayor | Head of municipality |
| Ballottaggio | Runoff | Second round voting |
| Primo Turno | First Round | Initial voting |
| Consiglio Comunale | City Council | Legislative body |
| Preferenze | Preferences | Candidate preference votes |
| Sezione | Polling Section | Voting location (52 total) |
| Affluenza | Turnout | Voter participation |
| Aventi Diritto | Eligible Voters | Registered voters |
| Votanti | Voters | Actual voters |
| Schede Bianche | Blank Ballots | Empty votes |
| Schede Nulle | Invalid Ballots | Void votes |
| Lista | List/Party | Political party list |

---

## Commands

```bash
npm create vite@latest . -- --template react-ts  # Initialize
npm install                                       # Install deps
npm run dev                                       # Dev server
npm run build                                     # Production build
npm run preview                                   # Preview build
```

---

## Notes

- 52 polling sections in Ascoli Piceno
- Data is from June 2009 elections
- Candidate names are in UPPERCASE with optional nicknames ("detto NICKNAME")
- All vote counts are integers
- Section numbers are strings ("1" to "52")
