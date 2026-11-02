# MeSH (Medical Subject Headings) — `mesh`

**For:** biomedical subject headings: diseases, anatomy, chemicals and drugs, procedures, as NLM uses them to index the literature. Prefer GO, CHEBI or UBERON when the thing is one of theirs; use MeSH for diseases, clinical concepts, and when the text is about how literature is indexed.

**Prefix:** `mesh` (Bioregistry; pattern `^(C|D|Q)\d+$`; URI `https://meshb.nlm.nih.gov/record/ui?ui=$1`, RDF `http://id.nlm.nih.gov/mesh/$1`). Example: «Mitochondria» [mesh:D008928].

**Licence (NLM terms, not a CC licence):** "NLM freely provides MeSH data." Users agree to acknowledge NLM as the source "in a clear and conspicuous manner" and not to imply NLM endorsement; users who republish or redistribute the data agree to keep it current or to say it may not be current and identify the MeSH version. MeSH Translation (MTMS) files are not covered. Checked: https://www.nlm.nih.gov/databases/download/terms_and_conditions_mesh.html (Bioregistry lists `CC0-1.0`; the NLM page above is the one to follow.)

**Query:**
- MeSH RDF Lookup API: `https://id.nlm.nih.gov/mesh/lookup/descriptor?label=Mitochondria&match=exact` returns `[{"resource":"http://id.nlm.nih.gov/mesh/D008928","label":"Mitochondria"}]` (https://id.nlm.nih.gov/mesh/).
- OLS4 hosts it as `mesh`.
- Download: https://www.nlm.nih.gov/databases/download/mesh.html

**In lookup.mjs:** in the default search set, through OLS4.

**Pages checked (2026-11-02):** the URLs above, https://bioregistry.io/api/registry/mesh
