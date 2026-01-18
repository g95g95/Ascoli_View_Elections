import type { ChartData, GroqResponse } from '../../types/chat';
import type { ElectionData } from '../dataLoader';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

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
      const sectionData = electionData.ballottaggio.sezioni[sectionId];
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
