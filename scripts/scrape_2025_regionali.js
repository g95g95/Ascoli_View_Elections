const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://eligo.comune.ap.it/20240608/elezioni/20250928';
const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'json', '2025', 'Regionali');
const NUM_SECTIONS = 52;

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function parseNominaliHtml(html, sectionNum) {
  const results = {};

  // Extract candidate rows - look for table rows with candidate data
  const tableMatch = html.match(/<table[^>]*class="[^"]*TabellaDati[^"]*"[^>]*>([\s\S]*?)<\/table>/i);
  if (!tableMatch) return results;

  const rows = tableMatch[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];

  for (const row of rows) {
    // Skip header rows
    if (row.includes('<th')) continue;

    const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
    if (cells.length >= 4) {
      // Extract candidate name from first cell
      const nameMatch = cells[0].match(/>([^<]+)</);
      if (nameMatch) {
        const name = nameMatch[1].trim().toUpperCase();
        // Extract votes from appropriate cell (usually 2nd or 3rd)
        const votesMatch = cells[1].match(/>(\d+)</);
        if (votesMatch && name && name.length > 2) {
          results[name] = parseInt(votesMatch[1], 10);
        }
      }
    }
  }

  return results;
}

function parseListeHtml(html, sectionNum) {
  const results = {};

  const tableMatch = html.match(/<table[^>]*class="[^"]*TabellaDati[^"]*"[^>]*>([\s\S]*?)<\/table>/i);
  if (!tableMatch) return results;

  const rows = tableMatch[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];

  for (const row of rows) {
    if (row.includes('<th')) continue;

    const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
    if (cells.length >= 2) {
      const nameMatch = cells[0].match(/>([^<]+)</);
      const votesMatch = cells[1].match(/>(\d+)</);
      if (nameMatch && votesMatch) {
        const name = nameMatch[1].trim();
        if (name && name.length > 2) {
          results[name] = parseInt(votesMatch[1], 10);
        }
      }
    }
  }

  return results;
}

function parseCandidatiHtml(html, sectionNum) {
  const results = [];

  // Find all party sections
  const partyMatches = html.matchAll(/<h\d[^>]*>([^<]+)<\/h\d>[\s\S]*?<table[^>]*>([\s\S]*?)<\/table>/gi);

  let currentParty = '';
  const tables = html.match(/<table[^>]*class="[^"]*TabellaDati[^"]*"[^>]*>([\s\S]*?)<\/table>/gi) || [];

  for (const table of tables) {
    const rows = table.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];

    for (const row of rows) {
      if (row.includes('<th')) continue;

      const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
      if (cells.length >= 2) {
        const nameMatch = cells[0].match(/>([^<]+)</);
        const votesMatch = cells[cells.length - 1].match(/>(\d+)</);
        if (nameMatch && votesMatch) {
          const name = nameMatch[1].trim().toUpperCase();
          if (name && name.length > 2) {
            results.push({
              nome: name,
              voti: parseInt(votesMatch[1], 10)
            });
          }
        }
      }
    }
  }

  return results;
}

async function scrapeAllData() {
  console.log('Starting scrape of 2025 Regionali data...');

  const nominaliData = {
    elezione: "Regionali",
    anno: 2025,
    data: "28-29 Settembre 2025",
    comune: "Ascoli Piceno",
    tipo: "presidente",
    candidati: [],
    sezioni: {}
  };

  const listeData = {
    elezione: "Regionali",
    anno: 2025,
    data: "28-29 Settembre 2025",
    comune: "Ascoli Piceno",
    liste: [],
    sezioni: {}
  };

  const preferenzeData = {
    elezione: "Regionali",
    anno: 2025,
    data: "28-29 Settembre 2025",
    comune: "Ascoli Piceno",
    liste: []
  };

  const candidateTotals = {};
  const listeTotals = {};
  const candidatiByLista = {};

  for (let i = 1; i <= NUM_SECTIONS; i++) {
    console.log(`Scraping section ${i}/${NUM_SECTIONS}...`);

    try {
      // Fetch nominali (president candidates)
      const nominaliUrl = `${BASE_URL}/regionalielenconominalirisultatisez${i}.html`;
      const nominaliHtml = await fetchUrl(nominaliUrl);
      const nominaliResults = parseNominaliHtml(nominaliHtml, i);
      nominaliData.sezioni[i.toString()] = { voti: nominaliResults };

      for (const [name, votes] of Object.entries(nominaliResults)) {
        candidateTotals[name] = (candidateTotals[name] || 0) + votes;
      }

      // Fetch liste
      const listeUrl = `${BASE_URL}/regionalielencolisterisultatisez${i}.html`;
      const listeHtml = await fetchUrl(listeUrl);
      const listeResults = parseListeHtml(listeHtml, i);
      listeData.sezioni[i.toString()] = { voti: listeResults };

      for (const [name, votes] of Object.entries(listeResults)) {
        listeTotals[name] = (listeTotals[name] || 0) + votes;
      }

      // Fetch candidati (preferences)
      const candidatiUrl = `${BASE_URL}/regionalielencocandidatirisultatisez${i}.html`;
      const candidatiHtml = await fetchUrl(candidatiUrl);
      const candidatiResults = parseCandidatiHtml(candidatiHtml, i);

      for (const cand of candidatiResults) {
        if (!candidatiByLista[cand.lista || 'SCONOSCIUTO']) {
          candidatiByLista[cand.lista || 'SCONOSCIUTO'] = {};
        }
        const lista = candidatiByLista[cand.lista || 'SCONOSCIUTO'];
        if (!lista[cand.nome]) {
          lista[cand.nome] = { totale: 0, sezioni: {} };
        }
        lista[cand.nome].totale += cand.voti;
        lista[cand.nome].sezioni[i.toString()] = cand.voti;
      }

      // Small delay to be nice to the server
      await new Promise(r => setTimeout(r, 100));
    } catch (err) {
      console.error(`Error scraping section ${i}:`, err.message);
    }
  }

  // Build final structures
  nominaliData.candidati = Object.entries(candidateTotals)
    .map(([nome, totale]) => ({ nome, totale }))
    .sort((a, b) => b.totale - a.totale);

  listeData.liste = Object.entries(listeTotals)
    .map(([nome, totale]) => ({ nome, totale }))
    .sort((a, b) => b.totale - a.totale);

  // Write files
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'presidente.json'),
    JSON.stringify(nominaliData, null, 2)
  );
  console.log('Written presidente.json');

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'liste.json'),
    JSON.stringify(listeData, null, 2)
  );
  console.log('Written liste.json');

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'preferenze_regionali.json'),
    JSON.stringify(preferenzeData, null, 2)
  );
  console.log('Written preferenze_regionali.json');

  console.log('Done!');
}

scrapeAllData().catch(console.error);
