# Collection B -- gym business knowledge

Shared by every gym (no `admin_id`), for the advisory answers (D31): this gym's numbers
from the database, plus a playbook or a finding from here, cited.

`manifest.csv` is the list, one row per document: `id, topic, kind, title, url, licence, status`.
A document is fetched and ingested only when its `status` is `approved`.

Three kinds, and the rule for each:

- **research** -- open-access papers from Europe PMC, CC BY or CC0 only. Stored as cleaned text
  (title, abstract, body; no references, author lists or funding notes), with the citation.
- **wikipedia** -- CC BY-SA 4.0. Stored as cleaned text with attribution; these files stay
  under CC BY-SA, as the licence requires.
- **summary** -- copyrighted industry articles are never stored. Gemini writes a summary in its
  own words; a script rejects any number or percentage that is not in the original article, and
  a sample is checked by hand. Each summary names and links its source.

English only. Topics: retention, onboarding, renewals-payments, pricing, member-experience,
marketing, staff, kpis-benchmarks, morocco-market.
