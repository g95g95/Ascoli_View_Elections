#!/usr/bin/env python3
"""Extract election data from Preferenze_mini.pdf and save to JSON."""
import fitz
import json
import re
import os

PDF_PATH = r"data\raw_Data\Preferenze_mini.pdf"
OUTPUT_DIR = r"data\json"

# Party info: (name, start_page, end_page, num_candidates)
COMUNALI_PARTIES = [
    ("Alveare per Regnicoli", 1, 2, 41),  # Already done
    ("Ascoli con Gibellieri Sindaco", 3, 4, 40),
    ("Guido Castelli Sindaco", 5, 6, 40),
    ("Il Popolo della Liberta'", 7, 8, 41),
    ("Italia dei Valori", 9, 10, 39),
    ("La Destra", 11, 12, 39),
    ("La Primavera di Ascoli - Con Antonio Canzian", 13, 14, 40),
    ("Lavoro e Legalita'", 15, 16, 40),
    ("Lega Nord", 17, 18, 40),
    ("Movimento Tutela Salute", 19, 20, 35),
    ("Partito Democratico", 21, 22, 40),
    ("Rifondazione Comunista - Comunisti Italiani", 23, 24, 40),
    ("Sinistra Democratica", 25, 26, 30),
    ("Udeur", 27, 28, 40),
    ("Unione Democratica di Centro", 29, 30, 40),
]

EUROPEE_PARTIES = [
    ("Casini - Unione di Centro", 31, 32, 14),
    ("Destra Sociale", 33, 34, 14),
    ("Di Pietro - Italia dei Valori", 35, 36, 14),
    ("Emma Bonino - Marco Pannella", 37, 38, 14),
    ("Forza Nuova", 39, 40, 14),
    ("Il Popolo della Liberta'", 41, 42, 14),
    ("L'Autonomia - Pensionati", 43, 44, 14),
    ("LD con Melchiorre", 45, 46, 14),
    ("Lega Nord", 47, 48, 14),
    ("Partito Comunista dei Lavoratori", 49, 50, 14),
    ("Partito Democratico", 51, 52, 14),
    ("Rifondazione Comunista - Comunisti Italiani", 53, 54, 14),
    ("Sinistra e Liberta'", 55, 56, 14),
]


def extract_page_tables(doc, page_num):
    """Extract table data from a page using PyMuPDF."""
    page = doc[page_num - 1]  # 0-indexed

    # Try to get tables
    tables = page.find_tables()
    if tables:
        for table in tables:
            data = table.extract()
            return data
    return None


def extract_page_text(doc, page_num):
    """Extract raw text from a page."""
    page = doc[page_num - 1]
    return page.get_text()


def parse_candidate_row(values):
    """Parse a row of values into candidate data."""
    if len(values) < 54:  # name + total + 52 sections
        return None

    name = values[0].strip() if values[0] else ""
    if not name or name.isdigit():
        return None

    try:
        total = int(values[1]) if values[1] else 0
    except ValueError:
        return None

    sezioni = {}
    for i in range(52):
        try:
            val = int(values[i + 2]) if values[i + 2] else 0
        except ValueError:
            val = 0
        sezioni[str(i + 1)] = val

    return {
        "nome": name,
        "totale": total,
        "sezioni": sezioni
    }


def extract_party_data(doc, party_name, page1, page2):
    """Extract all candidates for a party from its two pages."""
    candidates = []

    # Try table extraction first
    for page_num in [page1, page2]:
        table_data = extract_page_tables(doc, page_num)
        if table_data:
            for row in table_data[1:]:  # Skip header
                candidate = parse_candidate_row(row)
                if candidate:
                    candidates.append(candidate)

    return candidates


def main():
    print(f"Opening PDF: {PDF_PATH}")
    doc = fitz.open(PDF_PATH)
    print(f"PDF has {len(doc)} pages")

    # Extract raw text for each party's pages
    os.makedirs(os.path.join(OUTPUT_DIR, "extracted"), exist_ok=True)

    print("\n=== Extracting Comunali parties ===")
    for party_name, p1, p2, expected in COMUNALI_PARTIES[1:]:  # Skip first (already done)
        print(f"\nProcessing: {party_name} (pages {p1}-{p2})")

        # Save raw text
        text1 = extract_page_text(doc, p1)
        text2 = extract_page_text(doc, p2)

        safe_name = re.sub(r'[^\w\-]', '_', party_name)
        with open(os.path.join(OUTPUT_DIR, "extracted", f"comunali_{p1:02d}_{safe_name}.txt"), 'w', encoding='utf-8') as f:
            f.write(f"=== PAGE {p1} ===\n")
            f.write(text1)
            f.write(f"\n=== PAGE {p2} ===\n")
            f.write(text2)

        print(f"  Saved text to extracted/comunali_{p1:02d}_{safe_name}.txt")

    print("\n=== Extracting Europee parties ===")
    for party_name, p1, p2, expected in EUROPEE_PARTIES:
        print(f"\nProcessing: {party_name} (pages {p1}-{p2})")

        text1 = extract_page_text(doc, p1)
        text2 = extract_page_text(doc, p2)

        safe_name = re.sub(r'[^\w\-]', '_', party_name)
        with open(os.path.join(OUTPUT_DIR, "extracted", f"europee_{p1:02d}_{safe_name}.txt"), 'w', encoding='utf-8') as f:
            f.write(f"=== PAGE {p1} ===\n")
            f.write(text1)
            f.write(f"\n=== PAGE {p2} ===\n")
            f.write(text2)

        print(f"  Saved text to extracted/europee_{p1:02d}_{safe_name}.txt")

    doc.close()
    print("\n=== Extraction complete ===")


if __name__ == "__main__":
    main()
