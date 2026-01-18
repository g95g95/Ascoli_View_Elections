#!/usr/bin/env python3
"""Parse extracted text files and create JSON output."""
import json
import re
import os
from pathlib import Path

BASE_DIR = Path(r"data/json")
EXTRACTED_DIR = BASE_DIR / "extracted"

COMUNALI_PARTIES = [
    ("Ascoli con Gibellieri Sindaco", "comunali_03"),
    ("Guido Castelli Sindaco", "comunali_05"),
    ("Il Popolo della Liberta'", "comunali_07"),
    ("Italia dei Valori", "comunali_09"),
    ("La Destra", "comunali_11"),
    ("La Primavera di Ascoli - Con Antonio Canzian", "comunali_13"),
    ("Lavoro e Legalita'", "comunali_15"),
    ("Lega Nord", "comunali_17"),
    ("Movimento Tutela Salute", "comunali_19"),
    ("Partito Democratico", "comunali_21"),
    ("Rifondazione Comunista - Comunisti Italiani", "comunali_23"),
    ("Sinistra Democratica", "comunali_25"),
    ("Udeur", "comunali_27"),
    ("Unione Democratica di Centro", "comunali_29"),
]

EUROPEE_PARTIES = [
    ("Casini - Unione di Centro", "europee_31"),
    ("Destra Sociale", "europee_33"),
    ("Di Pietro - Italia dei Valori", "europee_35"),
    ("Emma Bonino - Marco Pannella", "europee_37"),
    ("Forza Nuova", "europee_39"),
    ("Il Popolo della Liberta'", "europee_41"),
    ("L'Autonomia - Pensionati", "europee_43"),
    ("LD con Melchiorre", "europee_45"),
    ("Lega Nord", "europee_47"),
    ("Partito Comunista dei Lavoratori", "europee_49"),
    ("Partito Democratico", "europee_51"),
    ("Rifondazione Comunista - Comunisti Italiani", "europee_53"),
    ("Sinistra e Liberta'", "europee_55"),
]

# Known party names to skip (these appear in the data as header rows)
PARTY_NAMES_TO_SKIP = [
    "Alveare per Regnicoli",
    "Ascoli con Gibellieri Sindaco",
    "Guido Castelli Sindaco",
    "Il Popolo della Liberta'",
    "Il Popolo della Liberta",
    "Italia dei Valori",
    "La Destra",
    "La Primavera di Ascoli - Con Antonio Canzian",
    "Lavoro e Legalita'",
    "Lavoro e Legalita",
    "Lega Nord",
    "Movimento Tutela Salute",
    "Partito Democratico",
    "Rifondazione Comunista - Comunisti Italiani",
    "Sinistra Democratica",
    "Udeur",
    "Unione Democratica di Centro",
    "Casini - Unione di Centro",
    "Destra Sociale",
    "Di Pietro - Italia dei Valori",
    "Emma Bonino - Marco Pannella",
    "Forza Nuova",
    "L'Autonomia - Pensionati",
    "LD con Melchiorre",
    "Partito Comunista dei Lavoratori",
    "Sinistra e Liberta'",
    "Sinistra e Liberta",
]


def find_file(prefix):
    """Find the extracted file matching prefix."""
    for f in EXTRACTED_DIR.iterdir():
        if f.name.startswith(prefix) and f.suffix == '.txt':
            return f
    return None


def is_party_name(text):
    """Check if text is a party name (to be skipped)."""
    text_normalized = text.strip()
    for pn in PARTY_NAMES_TO_SKIP:
        if text_normalized == pn or text_normalized.lower() == pn.lower():
            return True
    return False


def parse_text_file(filepath):
    """Parse extracted text file into candidate data."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split by pages
    parts = content.split("=== PAGE")
    page1_text = parts[1] if len(parts) > 1 else ""
    page2_text = parts[2] if len(parts) > 2 else ""

    # Parse each page
    page1_candidates = parse_page(page1_text, 1)  # sections 1-26
    page2_candidates = parse_page(page2_text, 27)  # sections 27-52

    # Merge candidates
    merged = merge_candidates(page1_candidates, page2_candidates)
    return merged


def parse_page(page_text, section_start):
    """Parse a single page, returning dict of {name: {totale, sezioni}}."""
    lines = page_text.strip().split('\n')

    candidates = {}
    i = 0

    # Skip until we find data (skip header lines)
    while i < len(lines):
        line = lines[i].strip()
        # Skip empty lines, header text, and pure number lines that are section numbers
        if not line:
            i += 1
            continue
        if "Comune di Ascoli" in line or "Tot. V." in line or "===" in line:
            i += 1
            continue
        if line.isdigit() and 1 <= int(line) <= 52:
            i += 1
            continue
        break

    # Now parse candidate blocks
    while i < len(lines):
        line = lines[i].strip()

        # Skip empty lines
        if not line:
            i += 1
            continue

        # Check if this line contains letters (potential name)
        if re.search(r'[A-Za-z]', line):
            # Check if it's a party name to skip
            if is_party_name(line):
                # Skip party name row: name + 26 values (no total line for party)
                i += 1
                # Skip the next 26 lines (section values for party header)
                for _ in range(26):
                    if i < len(lines):
                        i += 1
                continue

            # This is a candidate name
            name = line
            i += 1

            # Next line should be total
            if i >= len(lines):
                break
            total_line = lines[i].strip()
            try:
                totale = int(total_line) if total_line else 0
            except ValueError:
                # Not a valid number, skip this entry
                continue
            i += 1

            # Next 26 lines are section values
            sezioni = {}
            for sec_offset in range(26):
                sec_num = section_start + sec_offset
                if i >= len(lines):
                    sezioni[str(sec_num)] = 0
                else:
                    val_line = lines[i].strip()
                    try:
                        sezioni[str(sec_num)] = int(val_line) if val_line else 0
                    except ValueError:
                        # If we hit a non-number (like next candidate name), stop
                        sezioni[str(sec_num)] = 0
                    i += 1

            candidates[name] = {"totale": totale, "sezioni": sezioni}
        else:
            i += 1

    return candidates


def merge_candidates(page1, page2):
    """Merge candidate data from both pages."""
    merged = []

    # Use page1 names as primary
    for name, data1 in page1.items():
        # Find matching entry in page2
        data2 = page2.get(name, {"totale": data1["totale"], "sezioni": {}})

        # Merge sezioni
        all_sezioni = {}
        for k, v in data1.get("sezioni", {}).items():
            all_sezioni[k] = v
        for k, v in data2.get("sezioni", {}).items():
            all_sezioni[k] = v

        # Ensure all 52 sections exist
        for sec in range(1, 53):
            if str(sec) not in all_sezioni:
                all_sezioni[str(sec)] = 0

        merged.append({
            "nome": name,
            "totale": data1["totale"],
            "sezioni": all_sezioni
        })

    return merged


def load_existing_comunali():
    """Load existing preferenze_comunali.json."""
    filepath = BASE_DIR / "2009_Comunali" / "preferenze_comunali.json"
    if filepath.exists():
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    return None


def main():
    print("=== Parsing Comunali parties ===\n")

    # Load existing data
    existing = load_existing_comunali()
    if existing:
        print(f"Loaded existing data with {len(existing['liste'])} parties")

    # Parse new parties
    new_parties = []
    total_errors = 0
    for party_name, prefix in COMUNALI_PARTIES:
        filepath = find_file(prefix)
        if not filepath:
            print(f"  WARNING: No file found for {party_name}")
            continue

        print(f"Parsing: {party_name}")
        candidates = parse_text_file(filepath)
        print(f"  Found {len(candidates)} candidates")

        # Validate totals
        errors = 0
        for c in candidates:
            section_sum = sum(c["sezioni"].values())
            if section_sum != c["totale"]:
                errors += 1
                if errors <= 3:  # Only show first 3 errors per party
                    print(f"  WARNING: {c['nome']} total={c['totale']} sections={section_sum}")

        if errors == 0:
            print(f"  All totals verified OK")
        else:
            print(f"  {errors} validation errors")
            total_errors += errors

        new_parties.append({
            "nome": party_name,
            "candidati": candidates
        })

    # Combine with existing
    if existing:
        # Keep first party from existing (Alveare per Regnicoli)
        all_parties = existing["liste"][:1] + new_parties

        output = {
            "elezione": existing["elezione"],
            "turno": existing["turno"],
            "data": existing["data"],
            "comune": existing["comune"],
            "tipo": existing["tipo"],
            "descrizione": existing["descrizione"],
            "liste": all_parties
        }
    else:
        output = {
            "elezione": "Comunali",
            "turno": "primo turno",
            "data": "2009-06-07",
            "comune": "Ascoli Piceno",
            "tipo": "preferenze_candidati",
            "descrizione": "Preferenze espresse ai candidati consiglieri per lista",
            "liste": new_parties
        }

    # Save
    output_path = BASE_DIR / "2009_Comunali" / "preferenze_comunali.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\nSaved {len(output['liste'])} parties to {output_path}")

    # Now parse Europee
    print("\n=== Parsing Europee parties ===\n")

    europee_parties = []
    for party_name, prefix in EUROPEE_PARTIES:
        filepath = find_file(prefix)
        if not filepath:
            print(f"  WARNING: No file found for {party_name}")
            continue

        print(f"Parsing: {party_name}")
        candidates = parse_text_file(filepath)
        print(f"  Found {len(candidates)} candidates")

        # Validate
        errors = 0
        for c in candidates:
            section_sum = sum(c["sezioni"].values())
            if section_sum != c["totale"]:
                errors += 1
                if errors <= 3:
                    print(f"  WARNING: {c['nome']} total={c['totale']} sections={section_sum}")

        if errors == 0:
            print(f"  All totals verified OK")
        else:
            print(f"  {errors} validation errors")
            total_errors += errors

        europee_parties.append({
            "nome": party_name,
            "candidati": candidates
        })

    # Create Europee output
    europee_output = {
        "elezione": "Europee",
        "turno": "unico",
        "data": "2009-06-07",
        "comune": "Ascoli Piceno",
        "tipo": "preferenze_candidati",
        "descrizione": "Preferenze espresse ai candidati per lista - Elezioni Europee 2009",
        "liste": europee_parties
    }

    # Save
    europee_dir = BASE_DIR / "2009_Europee"
    europee_dir.mkdir(exist_ok=True)
    europee_path = europee_dir / "preferenze_europee.json"
    with open(europee_path, 'w', encoding='utf-8') as f:
        json.dump(europee_output, f, ensure_ascii=False, indent=2)

    print(f"\nSaved {len(europee_parties)} parties to {europee_path}")

    print(f"\n=== DONE (Total errors: {total_errors}) ===")


if __name__ == "__main__":
    main()
