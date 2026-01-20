import type { ChartData, GroqResponse } from '../../types/chat';
import type { ElectionData, ElectionArchive } from '../dataLoader';
import {
  analyzePartyTrend,
  analyzeTurnout,
  getTopParties,
  getTopCandidates,
  compareElections,
  generateArchiveSummary,
  searchCandidate,
} from '../analytics';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Tool definitions for the AI
const TOOL_DESCRIPTIONS = `
STRUMENTI DISPONIBILI (automatici - i dati vengono estratti automaticamente):

1. CERCA_CANDIDATO(nome): Cerca un candidato specifico in tutto l'archivio
   Esempio: "Come è andata Donatella Ferretti?" "Quanti voti ha preso Marco Rossi?"

2. ANALISI_PARTITO(nome_partito): Analizza l'andamento di un partito nel tempo
   Esempio: "Come è andato il PD nel tempo?"

3. ANALISI_AFFLUENZA(): Mostra il trend dell'affluenza alle urne
   Esempio: "Come è cambiata l'affluenza?"

4. TOP_PARTITI(limite): Classifica dei partiti più votati di sempre
   Esempio: "Quali sono i partiti più votati?"

5. TOP_CANDIDATI(limite): Classifica dei candidati più votati
   Esempio: "Chi sono i candidati più votati di sempre?"

6. CONFRONTA_ELEZIONI(id1, id2): Confronta due elezioni
   Esempio: "Confronta comunali 2009 con 2024"

IMPORTANTE: Quando ricevi dati su un candidato specifico, usa TUTTI i dati forniti per rispondere in modo completo.
`;

function buildArchiveSystemPrompt(archive: ElectionArchive): string {
  const summary = generateArchiveSummary(archive);

  return `Sei Rozzi-bot, un esperto analista di dati elettorali per Ascoli Piceno.
Hai accesso a un ARCHIVIO COMPLETO di tutte le elezioni dal 2009 al 2024.

${summary}

${TOOL_DESCRIPTIONS}

REGOLE IMPORTANTI:
1. Quando ricevi DATI ANALISI nella richiesta, USALI SEMPRE per rispondere - contengono i risultati della ricerca
2. Quando l'utente chiede di un candidato specifico, i dati estratti contengono TUTTE le loro occorrenze nell'archivio
3. Fornisci sempre numeri precisi e percentuali
4. Per ogni analisi, suggerisci il grafico più appropriato
5. Rispondi come un analista senior: osservazioni, pattern, anomalie
6. Se noti qualcosa di interessante nei dati, segnalalo proattivamente
7. NON dire mai "non ho informazioni" se i dati sono forniti nel messaggio

Per generare un grafico, includi alla fine un blocco JSON:
\`\`\`chart
{
  "type": "bar|pie|line|grouped-bar",
  "title": "Titolo del grafico",
  "data": [{"name": "Nome", "value": 123, "color": "#colore"}],
  "xAxisLabel": "Etichetta X",
  "yAxisLabel": "Etichetta Y"
}
\`\`\`

Per grafici grouped-bar (confronto), usa:
\`\`\`chart
{
  "type": "grouped-bar",
  "title": "Confronto",
  "groups": ["2009", "2024"],
  "data": [{"name": "PD", "values": [1000, 800]}]
}
\`\`\`

Rispondi sempre in italiano con tono professionale ma accessibile.`;
}

function buildSystemPrompt(electionData: ElectionData): string {
  const dataDescription = describeElectionData(electionData);

  return `Sei un assistente esperto in dati elettorali per le elezioni di Ascoli Piceno.
Hai accesso ai seguenti dati elettorali:

${dataDescription}

Quando l'utente chiede informazioni sui dati elettorali, rispondi in modo chiaro e conciso.
Se la domanda riguarda statistiche o confronti, suggerisci anche un grafico appropriato.

Per generare un grafico, includi alla fine della risposta un blocco JSON nel seguente formato:
\`\`\`chart
{
  "type": "bar|pie|line",
  "title": "Titolo del grafico",
  "data": [{"name": "Nome", "value": 123, "color": "#colore"}],
  "xAxisLabel": "Etichetta X",
  "yAxisLabel": "Etichetta Y"
}
\`\`\`

Rispondi sempre in italiano.`;
}

function describeElectionData(electionData: ElectionData): string {
  const parts: string[] = [];

  if (electionData.ballottaggio) {
    const b = electionData.ballottaggio;
    const candidates = b.candidati.map(c => `${c.nome}: ${c.totale} voti`).join(', ');
    parts.push(`BALLOTTAGGIO SINDACO (${b.data}): ${candidates}. 52 sezioni disponibili.`);
  }

  if (electionData.primoTurno) {
    const p = electionData.primoTurno;
    const candidates = p.candidati.map(c => `${c.nome}: ${c.totale} voti`).join(', ');
    parts.push(`PRIMO TURNO SINDACO (${p.data}): ${candidates}. 52 sezioni disponibili.`);
  }

  if (electionData.liste) {
    const l = electionData.liste;
    const top5 = l.liste.slice(0, 5).map(p => `${p.nome}: ${p.totale}`).join(', ');
    parts.push(`LISTE (${l.liste.length} liste): Top 5 - ${top5}`);
  }

  if (electionData.preferenze) {
    const pref = electionData.preferenze;
    const totalCandidates = pref.liste.reduce((sum, l) => sum + l.candidati.length, 0);
    parts.push(`PREFERENZE: ${pref.liste.length} liste, ${totalCandidates} candidati totali.`);
  }

  if (electionData.coalizioni) {
    const c = electionData.coalizioni;
    const coalizioni = c.coalizioni.map(co => `${co.nome}: ${co.totale} voti`).join(', ');
    parts.push(`COALIZIONI: ${coalizioni}`);
  }

  return parts.join('\n\n');
}

function extractArchiveDataForQuery(query: string, archive: ElectionArchive): string {
  const lowerQuery = query.toLowerCase();
  let contextData = '';

  // Candidate/person search - detect names in query
  // Extract potential person names using multiple strategies
  let candidateName: string | null = null;

  // Strategy 1: Look for patterns like "come è andata/andato [NAME]"
  const namePatterns = [
    /(?:come\s+(?:è\s+)?(?:andat[oa]|andamento)|quanti\s+voti\s+(?:ha\s+)?(?:preso|ottenuto)|cerca|informazioni\s+su|dati\s+(?:su|di)|chi\s+è)\s+(?:di\s+)?([A-Za-zàèéìòùÀÈÉÌÒÙ]+(?:\s+[A-Za-zàèéìòùÀÈÉÌÒÙ]+)+?)(?:\s+(?:nel|nelle|nel\s+corso|negli|durante|alle|ha\s+preso|ha\s+ottenuto|\?|$))/i,
    /([A-Za-zàèéìòùÀÈÉÌÒÙ]+(?:\s+[A-Za-zàèéìòùÀÈÉÌÒÙ]+)+?)\s+(?:quanti\s+voti|nel\s+tempo|nelle\s+elezioni|ha\s+preso|ha\s+ottenuto)/i,
    /(?:candidat[oa]|consigliere|sindaco)\s+([A-Za-zàèéìòùÀÈÉÌÒÙ]+(?:\s+[A-Za-zàèéìòùÀÈÉÌÒÙ]+)+)/i,
  ];

  for (const pattern of namePatterns) {
    const match = query.match(pattern);
    if (match && match[1]) {
      const extracted = match[1].trim();
      // Filter out common non-name words
      const excludeWords = ['come', 'nel', 'tempo', 'elezioni', 'ascoli', 'piceno', 'comunali', 'europee', 'regionali', 'partito', 'lista', 'corso', 'del', 'della', 'alle', 'negli', 'anni'];
      const words = extracted.split(/\s+/).filter(w => !excludeWords.includes(w.toLowerCase()) && w.length > 2);
      if (words.length >= 2) {
        candidateName = words.join(' ');
        break;
      }
    }
  }

  // Strategy 2: Find sequences of capitalized words that look like names
  if (!candidateName) {
    const words = query.split(/\s+/);
    const capitalizedSequence: string[] = [];
    const excludeWords = ['Come', 'Nel', 'Tempo', 'Elezioni', 'Ascoli', 'Piceno', 'Comunali', 'Europee', 'Regionali', 'Partito', 'Lista', 'Corso', 'Del', 'Della', 'Alle', 'Negli', 'Anni', 'Voti', 'Quanti'];

    for (const word of words) {
      const cleanWord = word.replace(/[?,!.]/g, '');
      if (/^[A-Z][a-zàèéìòù]+$/.test(cleanWord) && cleanWord.length > 2 && !excludeWords.includes(cleanWord)) {
        capitalizedSequence.push(cleanWord);
      } else if (capitalizedSequence.length >= 2) {
        break;
      } else {
        capitalizedSequence.length = 0;
      }
    }

    if (capitalizedSequence.length >= 2) {
      candidateName = capitalizedSequence.join(' ');
    }
  }

  // Strategy 3: If query seems to be asking about a person but we haven't found a name, try looser matching
  if (!candidateName && (lowerQuery.includes('andat') || lowerQuery.includes('voti') || lowerQuery.includes('preferenze'))) {
    // Look for any two consecutive words that could be a name (first letter uppercase)
    const match = query.match(/\b([A-Z][a-zàèéìòù]+)\s+([A-Z][a-zàèéìòù]+)\b/);
    if (match) {
      const potentialName = `${match[1]} ${match[2]}`;
      const excludeWords = ['Come', 'Nel', 'Tempo', 'Elezioni', 'Ascoli', 'Piceno'];
      if (!excludeWords.includes(match[1]) && !excludeWords.includes(match[2])) {
        candidateName = potentialName;
      }
    }
  }

  // Strategy 4: Single-word surname search (e.g., "cognome Bonelli", "risultati Bonelli", "Bonelli ha preso")
  if (!candidateName) {
    const singleNamePatterns = [
      /(?:cognome|surname|candidato|candidata|risultati|voti|preferenze)\s+([A-Z][a-zàèéìòù]+)/i,
      /([A-Z][a-zàèéìòù]+)\s+(?:ha\s+preso|ha\s+ottenuto|quanti\s+voti|nelle\s+elezioni|nel\s+tempo)/i,
      /(?:come\s+(?:è\s+)?(?:andat[oa])|cerca|informazioni\s+su)\s+([A-Z][a-zàèéìòù]+)(?:\s|$|\?)/i,
    ];

    for (const pattern of singleNamePatterns) {
      const match = query.match(pattern);
      if (match && match[1]) {
        const potentialName = match[1].trim();
        const excludeWords = ['Come', 'Nel', 'Tempo', 'Elezioni', 'Ascoli', 'Piceno', 'Comunali', 'Europee', 'Regionali', 'Partito', 'Lista'];
        if (!excludeWords.includes(potentialName) && potentialName.length > 3) {
          candidateName = potentialName;
          break;
        }
      }
    }
  }

  // Strategy 5: Last resort - find any capitalized word that looks like a surname (not common words)
  if (!candidateName && (lowerQuery.includes('andat') || lowerQuery.includes('candidat') || lowerQuery.includes('voti') || lowerQuery.includes('cognome'))) {
    const excludeWords = ['come', 'nel', 'tempo', 'elezioni', 'ascoli', 'piceno', 'comunali', 'europee', 'regionali', 'partito', 'lista', 'corso', 'del', 'della', 'alle', 'negli', 'anni', 'voti', 'quanti', 'stato', 'mai', 'qualcuno', 'qualche', 'risultati', 'cerca'];
    const words = query.split(/\s+/);

    for (const word of words) {
      const cleanWord = word.replace(/[?,!.]/g, '');
      if (/^[A-Z][a-zàèéìòù]+$/.test(cleanWord) && cleanWord.length > 4 && !excludeWords.includes(cleanWord.toLowerCase())) {
        candidateName = cleanWord;
        break;
      }
    }
  }

  if (candidateName) {
    const results = searchCandidate(archive, candidateName);
    if (results.length > 0) {
      contextData += `\nRISULTATI RICERCA CANDIDATO "${candidateName.toUpperCase()}":\n`;
      contextData += `Trovate ${results.length} occorrenze:\n`;
      for (const r of results) {
        const votes = r.votes ?? 0;
        const label = r.electionLabel || 'Elezione';
        const party = r.party || 'N/A';
        contextData += `- ${label}: ${votes.toLocaleString('it-IT')} voti (${party})\n`;
      }
      contextData += `\nDettaglio completo:\n${JSON.stringify(results, null, 2)}\n`;
    } else {
      contextData += `\nRICERCA CANDIDATO "${candidateName.toUpperCase()}": Nessun risultato trovato nell'archivio. Il cognome potrebbe non essere presente nei dati elettorali disponibili.\n`;
    }
  }

  // Party trend analysis
  const partyPatterns = [
    { pattern: /\b(pd|partito democratico)\b/i, name: 'PD' },
    { pattern: /\b(lega|lega nord)\b/i, name: 'Lega' },
    { pattern: /\b(forza italia|fi)\b/i, name: 'Forza Italia' },
    { pattern: /\b(fratelli d'?italia|fdi)\b/i, name: "Fratelli d'Italia" },
    { pattern: /\b(m5s|movimento 5 stelle|cinque stelle)\b/i, name: 'Movimento 5 Stelle' },
  ];

  for (const { pattern, name } of partyPatterns) {
    if (pattern.test(query)) {
      const trend = analyzePartyTrend(archive, name);
      if (trend) {
        contextData += `\nANALISI ${name.toUpperCase()}:\n`;
        contextData += `Media voti: ${trend.avgVotes.toLocaleString('it-IT')}\n`;
        contextData += `Picco: ${trend.peakYear} con ${trend.peakVotes.toLocaleString('it-IT')} voti\n`;
        contextData += `Trend: ${JSON.stringify(trend.trend)}\n`;
      }
    }
  }

  // Turnout analysis
  if (lowerQuery.includes('affluenza') || lowerQuery.includes('votanti') || lowerQuery.includes('partecipazione')) {
    const turnout = analyzeTurnout(archive);
    contextData += `\nANALISI AFFLUENZA:\n`;
    contextData += `Media: ${turnout.avgTurnout}%\n`;
    contextData += `Anno più alto: ${turnout.highestYear}\n`;
    contextData += `Anno più basso: ${turnout.lowestYear}\n`;
    contextData += `Trend: ${JSON.stringify(turnout.trend)}\n`;
  }

  // Top parties
  if (lowerQuery.includes('partiti') && (lowerQuery.includes('votati') || lowerQuery.includes('migliori') || lowerQuery.includes('classifica'))) {
    const topParties = getTopParties(archive, 10);
    contextData += `\nTOP 10 PARTITI (voti totali storici):\n`;
    contextData += JSON.stringify(topParties, null, 2);
  }

  // Top candidates
  if (lowerQuery.includes('candidati') && (lowerQuery.includes('votati') || lowerQuery.includes('migliori') || lowerQuery.includes('classifica') || lowerQuery.includes('sempre'))) {
    const topCandidates = getTopCandidates(archive, 20);
    contextData += `\nTOP 20 CANDIDATI (preferenze storiche):\n`;
    contextData += JSON.stringify(topCandidates, null, 2);
  }

  // Election comparison
  const compareMatch = query.match(/confronta.*?(\d{4}).*?(\d{4})/i);
  if (compareMatch) {
    const year1 = compareMatch[1];
    const year2 = compareMatch[2];
    const type = lowerQuery.includes('europe') ? 'europee' : 'comunali';
    const id1 = `${type}-${year1}`;
    const id2 = `${type}-${year2}`;
    const comparison = compareElections(archive, id1, id2);
    if (comparison) {
      contextData += `\nCONFRONTO ${id1} vs ${id2}:\n`;
      contextData += JSON.stringify(comparison.data, null, 2);
    }
  }

  // Specific election data
  const yearMatch = query.match(/\b(2009|2010|2014|2018|2019|2020|2022|2024)\b/);
  if (yearMatch && !compareMatch) {
    const year = yearMatch[1];
    for (const [id, election] of Object.entries(archive.elections)) {
      if (id.includes(year)) {
        contextData += `\nDATI ${id.toUpperCase()}:\n`;
        if (election.primoTurno) {
          contextData += `Sindaco: ${JSON.stringify(election.primoTurno.candidati)}\n`;
        }
        if (election.ballottaggio) {
          contextData += `Ballottaggio: ${JSON.stringify(election.ballottaggio.candidati)}\n`;
        }
        if (election.liste) {
          const top5 = election.liste.liste.slice(0, 5);
          contextData += `Top 5 liste: ${JSON.stringify(top5)}\n`;
        }
      }
    }
  }

  return contextData;
}

function extractDataForQuery(query: string, electionData: ElectionData): string {
  const lowerQuery = query.toLowerCase();
  let contextData = '';

  if (lowerQuery.includes('sindaco') || lowerQuery.includes('ballottaggio')) {
    if (electionData.ballottaggio) {
      contextData += `\nDati Ballottaggio:\n${JSON.stringify(electionData.ballottaggio.candidati, null, 2)}`;
    }
    if (electionData.primoTurno) {
      contextData += `\nDati Primo Turno:\n${JSON.stringify(electionData.primoTurno.candidati, null, 2)}`;
    }
  }

  if (lowerQuery.includes('list') || lowerQuery.includes('partit')) {
    if (electionData.liste) {
      contextData += `\nDati Liste:\n${JSON.stringify(electionData.liste.liste, null, 2)}`;
    }
  }

  if (lowerQuery.includes('sezione') || lowerQuery.includes('sez')) {
    const sectionMatch = query.match(/sezione\s*(\d+)/i);
    if (sectionMatch && electionData.ballottaggio) {
      const sectionId = sectionMatch[1];
      const sectionData = electionData.ballottaggio?.sezioni?.[sectionId];
      if (sectionData) {
        contextData += `\nDati Sezione ${sectionId}:\n${JSON.stringify(sectionData, null, 2)}`;
      }
    }
  }

  if (lowerQuery.includes('affluenza') || lowerQuery.includes('votanti')) {
    if (electionData.ballottaggio) {
      contextData += `\nAffluenza Ballottaggio:\n${JSON.stringify(electionData.ballottaggio.affluenza, null, 2)}`;
    }
    if (electionData.primoTurno) {
      contextData += `\nAffluenza Primo Turno:\n${JSON.stringify(electionData.primoTurno.affluenza, null, 2)}`;
    }
  }

  if (lowerQuery.includes('candidat') || lowerQuery.includes('preferenz')) {
    if (electionData.preferenze) {
      const topCandidates = electionData.preferenze.liste.flatMap(l =>
        l.candidati.map(c => ({ nome: c.nome, lista: l.nome, totale: c.totale }))
      ).sort((a, b) => b.totale - a.totale).slice(0, 20);
      contextData += `\nTop 20 Candidati per preferenze:\n${JSON.stringify(topCandidates, null, 2)}`;
    }
  }

  if (lowerQuery.includes('coaliz')) {
    if (electionData.coalizioni) {
      contextData += `\nCoalizioni:\n${JSON.stringify(electionData.coalizioni.coalizioni, null, 2)}`;
    }
  }

  return contextData;
}

function parseChartFromResponse(text: string): { cleanText: string; chartData?: ChartData } {
  const chartRegex = /```chart\s*([\s\S]*?)```/;
  const match = text.match(chartRegex);

  if (match) {
    try {
      const chartData = JSON.parse(match[1]) as ChartData;
      const cleanText = text.replace(chartRegex, '').trim();
      return { cleanText, chartData };
    } catch {
      return { cleanText: text };
    }
  }

  return { cleanText: text };
}

// New: Send chat message with archive support
export async function sendArchiveChatMessage(
  message: string,
  archive: ElectionArchive,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<GroqResponse> {
  const systemPrompt = buildArchiveSystemPrompt(archive);
  const contextData = extractArchiveDataForQuery(message, archive);

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-6).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: contextData ? `${message}\n\nDATI ANALISI:\n${contextData}` : message }
  ];

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.7,
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content || 'Mi dispiace, non ho potuto elaborare la risposta.';

    const { cleanText, chartData } = parseChartFromResponse(assistantMessage);

    return {
      text: cleanText,
      chartData
    };
  } catch (error) {
    console.error('Groq API error:', error);
    throw new Error('Errore di connessione al servizio AI. Riprova più tardi.');
  }
}

// Legacy: Send chat message with single election data
export async function sendChatMessage(
  message: string,
  electionData: ElectionData,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<GroqResponse> {
  const systemPrompt = buildSystemPrompt(electionData);
  const contextData = extractDataForQuery(message, electionData);

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-6).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: contextData ? `${message}\n\nDati rilevanti:\n${contextData}` : message }
  ];

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.7,
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content || 'Mi dispiace, non ho potuto elaborare la risposta.';

    const { cleanText, chartData } = parseChartFromResponse(assistantMessage);

    return {
      text: cleanText,
      chartData
    };
  } catch (error) {
    console.error('Groq API error:', error);
    throw new Error('Errore di connessione al servizio AI. Riprova più tardi.');
  }
}
