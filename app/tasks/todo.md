# Task: Upgrade Chatbot to Senior Data Analyst Level

## Context
The current chatbot uses Groq LLM with keyword-based data filtering. It works but lacks the intelligence of a true data analyst. We need to transform it into an MCP-style intelligent agent that can:
- Query all elections as an archive
- Detect and visualize trends automatically
- Choose appropriate chart types based on data shape
- Provide proactive insights

## Analysis
Current implementation:
- `app/src/lib/groq/groqService.ts` - Keyword-based data extraction
- `app/src/components/chat/ElectionChatbot.tsx` - UI component
- `app/src/components/chat/DynamicChart.tsx` - Basic charts (bar, pie, line)
- Data loaded per-election, not as unified archive

## Affected Files
- [x] `app/src/lib/groq/groqService.ts` — Add smart tool functions, archive queries
- [x] `app/src/lib/dataLoader.ts` — Add unified archive loading
- [x] `app/src/types/elections.ts` — Add archive types, analysis result types
- [x] `app/src/types/chat.ts` — Add grouped-bar chart types
- [x] `app/src/components/chat/ElectionChatbot.tsx` — Enhanced UI for insights
- [x] `app/src/components/chat/DynamicChart.tsx` — Add grouped bar chart
- [x] `app/src/lib/analytics/index.ts` — NEW: Analytics engine for pre-computed insights
- [x] `app/src/App.tsx` — Load archive on mount, pass to chatbot

## Implementation Plan

### Phase 1: Unified Data Archive ✅
- [x] 1.1 Create `ElectionArchive` type that holds all elections across years
- [x] 1.2 Create `loadElectionArchive()` function to load all available data
- [x] 1.3 Update App.tsx to load archive instead of single election
- [x] 1.4 Create archive summary generator (years, types, totals)

### Phase 2: Analytics Engine ✅
- [x] 2.1-2.5 Created unified `app/src/lib/analytics/index.ts` with:
  - `analyzePartyTrend()` - cross-year party performance
  - `analyzeTurnout()` - affluenza trends
  - `getTopParties()` - historical party ranking
  - `getTopCandidates()` - historical candidate ranking
  - `compareElections()` - election comparison
  - `generateArchiveSummary()` - archive statistics

### Phase 3: Smart Tool Functions ✅
- [x] 3.1 Tool descriptions in system prompt (ANALISI_PARTITO, ANALISI_AFFLUENZA, etc.)
- [x] 3.2 Implemented `analyzePartyTrend(partyName)` - auto-triggered by party name detection
- [x] 3.3 Implemented turnout analysis - auto-triggered by "affluenza" keyword
- [x] 3.4 Implemented election comparison - auto-triggered by "confronta YYYY YYYY"
- [x] 3.5 Implemented `getTopCandidates()` - auto-triggered by candidate queries
- [x] 3.7 Updated groqService with `sendArchiveChatMessage()` function

### Phase 4: Smart Chart Selection ✅
- [x] 4.1 System prompt instructs LLM on appropriate chart types
- [x] 4.2 Added grouped-bar chart to DynamicChart
- [x] 4.3 Horizontal bar chart already supported (default bar type)
- [x] 4.4 Line chart already supported

### Phase 5: Proactive Insights ✅
- [x] 5.1 Archive summary generated with interesting stats
- [x] 5.2 Updated welcome message with archive-specific suggestions
- [x] 5.3 System prompt encourages proactive observations

### Phase 6: Enhanced Prompting ✅
- [x] 6.1 Rewrote system prompt as "Senior Data Analyst"
- [x] 6.2 Added chart format examples in prompt
- [x] 6.4 Added data schema description in prompt

### Phase 7: Testing & Polish ✅
- [x] 7.1-7.4 Build passes, no TypeScript errors
- [x] 7.5 Fixed unused variable warnings

## Testing Plan
- [ ] Query: "Come è cambiata l'affluenza dal 2009 al 2024?" → Should show trend chart
- [ ] Query: "Quali sezioni hanno cambiato più voti tra 2009 e 2019?" → Swing analysis
- [ ] Query: "Confronta PD e centrodestra in tutte le elezioni" → Grouped bar
- [ ] Query: "Chi sono i candidati più votati di sempre?" → Cross-election ranking

## Risks & Considerations
- Groq free tier rate limits (30 req/min) - add throttling if needed
- Large data payloads may exceed token limits - need smart summarization
- Chart complexity may confuse users - keep UI clean

## Rollback Plan
- Original groqService functions preserved (sendChatMessage still works)
- Archive is optional - falls back to single election mode if not loaded

---

## Progress Tracking

### Current Phase: COMPLETED
### Completed Items: 25/25
### Status: Build passes, ready for testing

---

## Review

### Changes Made
- **app/src/types/elections.ts**: Added `ElectionSummary`, `PartyTrend`, `ArchiveStats` types
- **app/src/types/chat.ts**: Added `GroupedChartDataPoint`, updated `ChartData` to support `grouped-bar` type
- **app/src/lib/dataLoader.ts**: Added `ElectionArchive` interface and `loadElectionArchive()` function
- **app/src/lib/analytics/index.ts**: NEW - Complete analytics engine with party trends, turnout analysis, rankings, comparisons
- **app/src/lib/groq/groqService.ts**: Added `sendArchiveChatMessage()`, archive-aware prompts, smart data extraction
- **app/src/components/chat/ElectionChatbot.tsx**: Updated to accept archive prop, archive-specific welcome messages
- **app/src/components/chat/DynamicChart.tsx**: Added grouped-bar chart visualization
- **app/src/App.tsx**: Loads archive on mount, passes to chatbot (archive has priority over single election)

### Tests Added/Modified
- Build passes without errors

### Documentation Updated
- [x] tasks/todo.md - This file

### Verification
- [x] All TypeScript checks pass (`npm run build`)
- [x] No linter warnings
- [ ] Manually test chatbot queries (requires running dev server)

### Notes for Future
- Consider adding rate limiting for Groq API calls
- Consider caching archive data in localStorage
- Could add more chart types (heatmap, scatter) if needed
- Could implement section-level swing analysis for deeper insights
