#!/bin/bash

# Scrape 2025 Regionali election data
OUTPUT_DIR="../data/json/2025/Regionali"
BASE_URL="https://eligo.comune.ap.it/20240608/elezioni/20250928"

mkdir -p "$OUTPUT_DIR"

echo "Scraping nominali (president) data..."

# Initialize arrays for totals
declare -A RICCI_VOTES
declare -A MARINELLI_VOTES
declare -A GERARDI_VOTES
declare -A ACQUAROLI_VOTES
declare -A BOLLETTA_VOTES

RICCI_TOTAL=0
MARINELLI_TOTAL=0
GERARDI_TOTAL=0
ACQUAROLI_TOTAL=0
BOLLETTA_TOTAL=0

# Scrape all 52 sections for nominali
for i in $(seq 1 52); do
    echo "Section $i..."
    HTML=$(curl -s "${BASE_URL}/regionalielenconominalirisultatisez${i}.html" 2>/dev/null)

    # Extract votes using grep and sed
    RICCI=$(echo "$HTML" | grep -A2 "MATTEO RICCI" | grep "align=\"right\"" | head -1 | sed 's/.*>\([0-9]*\)<.*/\1/')
    MARINELLI=$(echo "$HTML" | grep -A2 "BEATRICE MARINELLI" | grep "align=\"right\"" | head -1 | sed 's/.*>\([0-9]*\)<.*/\1/')
    GERARDI=$(echo "$HTML" | grep -A2 "FRANCESCO GERARDI" | grep "align=\"right\"" | head -1 | sed 's/.*>\([0-9]*\)<.*/\1/')
    ACQUAROLI=$(echo "$HTML" | grep -A2 "FRANCESCO ACQUAROLI" | grep "align=\"right\"" | head -1 | sed 's/.*>\([0-9]*\)<.*/\1/')
    BOLLETTA=$(echo "$HTML" | grep -A2 "CLAUDIO BOLLETTA" | grep "align=\"right\"" | head -1 | sed 's/.*>\([0-9]*\)<.*/\1/')

    RICCI_VOTES[$i]=${RICCI:-0}
    MARINELLI_VOTES[$i]=${MARINELLI:-0}
    GERARDI_VOTES[$i]=${GERARDI:-0}
    ACQUAROLI_VOTES[$i]=${ACQUAROLI:-0}
    BOLLETTA_VOTES[$i]=${BOLLETTA:-0}

    RICCI_TOTAL=$((RICCI_TOTAL + ${RICCI:-0}))
    MARINELLI_TOTAL=$((MARINELLI_TOTAL + ${MARINELLI:-0}))
    GERARDI_TOTAL=$((GERARDI_TOTAL + ${GERARDI:-0}))
    ACQUAROLI_TOTAL=$((ACQUAROLI_TOTAL + ${ACQUAROLI:-0}))
    BOLLETTA_TOTAL=$((BOLLETTA_TOTAL + ${BOLLETTA:-0}))

    sleep 0.1
done

echo "Totals: RICCI=$RICCI_TOTAL, ACQUAROLI=$ACQUAROLI_TOTAL, MARINELLI=$MARINELLI_TOTAL, GERARDI=$GERARDI_TOTAL, BOLLETTA=$BOLLETTA_TOTAL"
