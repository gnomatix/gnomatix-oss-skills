# Excluded: restrictive licences

A tag is a pointer that anyone reading the log must be able to follow and reuse. An identifier from a terminology whose licence restricts who may use it, or requires a signed agreement first, makes the log itself depend on that agreement. Such terminologies are left out of the starter set, and the agent does not tag with them even when it knows a code.

## SNOMED CT — excluded

Bioregistry registers `snomedct` and gives its licence as the UMLS licence agreement (https://uts.nlm.nih.gov/uts/assets/LicenseAgreement.pdf), not an open licence. NLM's SNOMED CT licensing page says: "Use of SNOMED CT is subject to the IHTSDO Affiliate license provisions"; "Licensees of the UMLS Metathesaurus have free access to SNOMED CT"; and "Users should carefully read the license agreement before re-distributing any content in any type of application as there may be additional restrictions". Use outside the licensed group needs that licence first.

Checked (2026-11-02): https://www.nlm.nih.gov/healthit/snomedct/snomed_licensing.html, https://bioregistry.io/api/registry/snomedct

For a clinical concept, use MeSH ([mesh.md](mesh.md)) or Wikidata instead; write the SNOMED CT code in plain text, untagged, only if the user supplies it and needs it.

`lookup.mjs` reflects this: `--ontology snomedct` is refused as outside the starter set, and `--resolve snomedct:<code>` prints the Bioregistry URL with "outside the starter set; no label source" and no tag.

## Included with conditions (not excluded)

- **ISO 639-3**: free to use with attribution, but the code set may not be modified or redistributed. The skill uses single codes and does not ship the table. See [iso-639-3.md](iso-639-3.md).
- **MeSH**: free under NLM terms (acknowledge NLM; no implied endorsement; currency notice when redistributing). See [mesh.md](mesh.md).
- **schema.org** (CC BY-SA 3.0) and **EDAM** (CC BY-SA 4.0): share-alike. Citing an identifier is not redistributing the vocabulary; copying definitions into a derived vocabulary would carry the share-alike condition.
