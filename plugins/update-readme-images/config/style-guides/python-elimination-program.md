# Style Guide — `gnomatix-oss-skills:plugins:python-elimination-program`

- **Namespace**: `gnomatix-oss-skills:plugins:python-elimination-program`
- **Inherits**: `gnomatix-oss-skills` (`inherit: true`)
- **Scope**: `plugins/python-elimination-program/**`

## 1. Setting & Cast Affinity

- **Primary Banner Setting (`top-level-panel`)**: Sunlit Florida Everglades cypress swamp with a flat-bottomed airboat gliding past Spanish moss and an unimpressed alligator, paired with a bottom G.I. Joe PSA closing card (`"Kids, if somebody offers you VENVS ... Just say NO."`).
- **Sub-Panel Setting (`sub-panel`)**: 1990s perimeter-table high-school CRT computer lab at Sir Winston Churchill Secondary School (St. Catharines, ON).
- **Recurring Cast (Realistic Human Skin Tones)**:
  - **Stanley Lee "Old Willy" Wilson (`1941–2022`)**: Stocky ~5'9" former Chicago Blackhawks farm-team goaltender build; thick silver-white hair in a neat 1960s IBM-engineer side-part held with pomade; deep crinkly laugh lines around twinkling eyes; wide knowing gleeful grin; navy-blue and gold collared golf/polo shirt with a mid-1960s circular MIT `"Mens et Manus"` seal crest on the left chest; wielding either his wooden 1-meter classroom ruler (meter stick) rested behind his neck across his shoulders or a vintage wooden goalie stick (`"Try harder, dummy!"`).
  - **Zartan** (*G.I. Joe: ARAH* #76), **Destro** (chrome mask + small white captain's hat at the rear tiller), **Jake "The Snake" Roberts** (carrying the `"KEEPERS"` / `"SNAKES"` burlap sack), and **Saint Patrick** (green bishop's robes and miter, holding a pint of stout).

## 2. Oval Tribute Inset Specification (`inset-oval`)

- **Target Asset**: `plugins/python-elimination-program/assets/images/old-willy-tribute-oval.png`
- **Visual Style**: Respectful 1990s high-school faculty yearbook vertical oval bust portrait of Stanley "Old Willy" Wilson against a soft muted studio blue-grey backdrop (`#5B6E82`), framed inside a concentric deep navy (`#0B1F4A`) and burnished gold (`#D4AF37`) oval border.
- **Transparency Requirement**: Must be a 4-channel RGBA PNG (`srgba`) with **100% transparent exterior corners (`alpha = 0`)** outside the outer oval ring so the portrait renders as a true floating oval inset window on both light and dark README themes.
