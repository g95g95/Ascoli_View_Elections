const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://eligo.comune.ap.it/20240608/elezioni/20240609/comunalielencocandidatirisultatisez';
const SECTIONS = 52;

// Data structure to accumulate results
const partyData = {}; // { partyName: { candidateName: { totale: 0, sezioni: {} } } }

function fetchSection(sectionNum) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${sectionNum}.html`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ section: sectionNum, html: data }));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseHtml(html, sectionNum) {
  const results = [];

  // Each row has 4 cells: image | party | candidate | votes
  // Match table rows with 4 td elements
  const rowRegex = /<tr[^>]*>\s*<td[^>]*>.*?<\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<\/tr>/gs;

  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    let partyName = decodeHtmlEntities(match[1].trim());
    let candidateName = decodeHtmlEntities(match[2].trim());
    const votes = parseInt(match[3], 10);

    // Skip header rows, empty rows, or numeric-only party names
    if (partyName && candidateName && !isNaN(votes) &&
        !/^\d+$/.test(partyName) && !/^\d+$/.test(candidateName)) {
      results.push({
        party: partyName,
        candidate: candidateName,
        votes: votes
      });
    }
  }

  return results;
}

function aggregateResults(sectionResults, sectionNum) {
  for (const result of sectionResults) {
    const { party, candidate, votes } = result;

    if (!partyData[party]) {
      partyData[party] = {};
    }

    if (!partyData[party][candidate]) {
      partyData[party][candidate] = {
        totale: 0,
        sezioni: {}
      };
    }

    partyData[party][candidate].sezioni[sectionNum.toString()] = votes;
    partyData[party][candidate].totale += votes;
  }
}

function buildFinalJson() {
  const liste = [];

  for (const [partyName, candidates] of Object.entries(partyData)) {
    const candidatiArray = [];

    for (const [candidateName, data] of Object.entries(candidates)) {
      // Ensure all 52 sections are present
      const sezioni = {};
      for (let i = 1; i <= SECTIONS; i++) {
        sezioni[i.toString()] = data.sezioni[i.toString()] || 0;
      }

      candidatiArray.push({
        nome: candidateName,
        totale: data.totale,
        sezioni: sezioni
      });
    }

    // Sort by total votes descending
    candidatiArray.sort((a, b) => b.totale - a.totale);

    liste.push({
      nome: partyName,
      candidati: candidatiArray
    });
  }

  return {
    elezione: "Comunali",
    turno: "primo turno",
    data: "2024-06-08",
    comune: "Ascoli Piceno",
    tipo: "preferenze_candidati",
    descrizione: "Preferenze espresse ai candidati consiglieri per lista",
    liste: liste
  };
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('Starting to fetch candidate data from 52 sections...');

  // Fetch sections one at a time with delay to avoid connection issues
  for (let i = 1; i <= SECTIONS; i++) {
    try {
      console.log(`Fetching section ${i}...`);
      const { section, html } = await fetchSection(i);
      const parsed = parseHtml(html, section);
      aggregateResults(parsed, section);
      console.log(`  Section ${section}: ${parsed.length} candidates found`);
      await delay(200); // Small delay between requests
    } catch (err) {
      console.error(`  Error fetching section ${i}: ${err.message}`);
      // Retry once after delay
      await delay(1000);
      try {
        const { section, html } = await fetchSection(i);
        const parsed = parseHtml(html, section);
        aggregateResults(parsed, section);
        console.log(`  Section ${section}: ${parsed.length} candidates found (retry)`);
      } catch (err2) {
        console.error(`  Failed again for section ${i}: ${err2.message}`);
      }
    }
  }

  console.log('\nBuilding final JSON...');
  const finalJson = buildFinalJson();

  // Ensure output directory exists
  const outDir = path.join(__dirname, 'data', 'json', '2024_comunali');
  fs.mkdirSync(outDir, { recursive: true });

  // Write the file
  const outPath = path.join(outDir, 'preferenze_comunali.json');
  fs.writeFileSync(outPath, JSON.stringify(finalJson, null, 2), 'utf8');

  console.log(`\nDone! Written to ${outPath}`);
  console.log(`Total parties: ${finalJson.liste.length}`);

  let totalCandidates = 0;
  for (const lista of finalJson.liste) {
    totalCandidates += lista.candidati.length;
    console.log(`  ${lista.nome}: ${lista.candidati.length} candidates`);
  }
  console.log(`Total candidates: ${totalCandidates}`);
}

main().catch(console.error);
