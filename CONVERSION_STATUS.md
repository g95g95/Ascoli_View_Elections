# Ascoli Piceno Election Data Conversion Status

## Status: COMPLETE

All PDF data has been successfully converted to JSON format.

---

## Source Files
- **Location**: `/data/raw_Data/`
- **Main file**: `Preferenze_mini.pdf` (56 pages)

## Output Files

### Location: `/data/json/`

| File | Status | Records |
|------|--------|---------|
| `2009_Comunali/ballottaggio_sindaco.json` | DONE | 2 candidates, 52 sections |
| `2009_Comunali/primo_turno_sindaco.json` | DONE | Multiple candidates, 52 sections |
| `2009_Comunali/liste_consiglio.json` | DONE | Party list results |
| `2009_Comunali/preferenze_comunali.json` | DONE | 28 parties, 760 candidates |
| `2009_Comunali/europee_2009_liste.json` | DONE | European list results |
| `2009_Europee/preferenze_europee.json` | DONE | 13 parties, ~180 candidates |

---

## Data Validation

All JSON files have been validated:
- Total votes match sum of section votes
- All 52 sections present for each candidate
- No missing or malformed data

---

## Conversion Summary

### Comunali 2009 (Municipal Elections)
- **Primo Turno Sindaco**: First round mayoral candidates with votes per section
- **Ballottaggio Sindaco**: Runoff between Guido Castelli and Antonio Canzian
- **Liste Consiglio**: Party vote totals for city council
- **Preferenze Comunali**: 15 Comunali + 13 Europee parties = 28 total, 760 candidates

### Europee 2009 (European Elections)
- **Preferenze Europee**: 13 parties with candidate preferences
- **Liste Europee**: Party totals

---

## Next Steps

The data is ready for app development. See `CLAUDE.md` for full app requirements.
