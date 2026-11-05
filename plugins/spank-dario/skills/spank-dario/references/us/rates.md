# US government rate references for time loss

These ground the hourly rate used for actual-loss estimates in published US government data. The data is in `rates-gsa-calc.json`, and `bin/refresh-rates.js` rebuilds it.

- **Source:** GSA's Contract-Awarded Labor Category (CALC) data, the ceiling hourly rates that vendors may bill the US federal government under GSA schedules. Read through the GSA API at https://api.gsa.gov/acquisition/calc/v3/api/ceilingrates/ on 2026-11-04. Field used: `current_price`, in USD per hour.
- **Method:** every record matching each keyword search, filtered to `min_years_experience` of 10 or more. Percentiles are computed by `bin/refresh-rates.js`. The figures are computed from the data, not published by GSA as percentiles.

| Keyword | Records (10+ years) | 25th | Median | 75th | 90th | Max |
|---|---|---|---|---|---|---|
| software engineer | 811 | 151.63 | 178.59 | 217.62 | 263.20 | 465.60 |
| systems administrator | 280 | 118.80 | 147.79 | 183.06 | 218.94 | 358.00 |
| data scientist | 285 | 177.16 | 207.38 | 256.91 | 297.59 | 449.62 |
| bioinformatics | 7 | 188.42 | 200.26 | 289.69 | 329.76 | 340.77 |

## Limits of the data

- Keyword search matches labor-category titles loosely, so each set mixes related categories.
- The bioinformatics set has 7 records.
- These are federal ceiling rates, a cap on what vendors may bill. They are not wages.
