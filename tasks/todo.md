# Task: Chatbot → Election Data Analyst con Skills

## Context
Trasformare il chatbot da semplice Q&A a un vero data analyst AI con:
- Skills/Tools strutturati (stile MCP server)
- Accesso a TUTTI i dati elettorali (2009-2024)
- Capacità di analisi cross-elezione
- Serie temporali e trend analysis
- Ricerca candidati completa

## Dati Disponibili
- **2009**: Comunali (sindaco, liste, preferenze) + Europee
- **2010**: Regionali (coalizioni, preferenze)
- **2014**: Comunali (sindaco, liste, preferenze)
- **2018**: Politiche (uninominale camera, liste)
- **2019**: Comunali + Europee
- **2020**: Regionali (presidente, liste, preferenze)
- **2022**: Politiche (liste, preferenze, affluenza)
- **2024**: Comunali (sindaco, liste, preferenze)

## Architettura Proposta

```
lib/
├── analytics/
│   ├── skills.ts           # Definizione skills (tipo MCP tools)
│   ├── candidateAnalyzer.ts # Analisi candidati
│   ├── sectionAnalyzer.ts   # Analisi sezioni
│   ├── trendAnalyzer.ts     # Serie temporali e trend
│   ├── partyAnalyzer.ts     # Analisi partiti
│   └── dataIndex.ts         # Indice globale di tutti i dati
├── groq/
│   └── groqService.ts       # Aggiornato con nuovo context
```

## Skills da Implementare

### 1. `searchCandidate(name: string)`
- Cerca un candidato in TUTTE le elezioni
- Restituisce: elezioni partecipate, lista/partito, voti totali, preferenze per sezione
- Fuzzy matching sul nome

### 2. `getCandidateHistory(name: string)`
- Serie temporale del candidato (se presente in più elezioni)
- Evoluzione voti nel tempo

### 3. `analyzeSection(sectionId: string, year?: string)`
- Tutti i risultati di una sezione
- Top candidati/liste per quella sezione
- Affluenza storica

### 4. `compareSections(sectionIds: string[])`
- Confronto tra sezioni
- Differenze di voto tra aree

### 5. `getPartyTrend(partyName: string)`
- Performance di un partito nel tempo
- Cross-election analysis

### 6. `getTopCandidates(election: string, limit: number)`
- Ranking candidati per una specifica elezione
- Ordinamento per voti/preferenze

### 7. `getElectionSummary(year: string, type: string)`
- Riassunto completo di un'elezione
- Vincitori, affluenza, statistiche

### 8. `crossElectionAnalysis(metric: string)`
- Confronto affluenza tra elezioni
- Confronto partecipazione
- Trend storici

## Implementation Plan

- [ ] 1. Creare `dataIndex.ts` - Carica e indicizza TUTTI i dati
- [ ] 2. Creare `skills.ts` - Definizione interfacce skills
- [ ] 3. Implementare `candidateAnalyzer.ts` - searchCandidate, getCandidateHistory
- [ ] 4. Implementare `sectionAnalyzer.ts` - analyzeSection, compareSections
- [ ] 5. Implementare `trendAnalyzer.ts` - getPartyTrend, crossElectionAnalysis
- [ ] 6. Implementare `partyAnalyzer.ts` - analisi partiti
- [ ] 7. Aggiornare `groqService.ts` - Nuovo system prompt con skills
- [ ] 8. Aggiornare `ElectionChatbot.tsx` - Domande suggerite dinamiche

## Testing Plan
- [ ] Test ricerca candidato "CASTELLI"
- [ ] Test serie temporale partito "PD"
- [ ] Test analisi sezione 1
- [ ] Test cross-election affluenza

## Risks
- Performance: Caricare tutti i dati in memoria (MB di JSON)
- Fuzzy matching: Nomi scritti diversamente tra elezioni
- Dati mancanti: Non tutte le elezioni hanno stessi campi
