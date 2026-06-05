# actually-im-the-ahole

An Agent Skill that performs the final-pass discretion review of agent-authored prose before it ships under the user's byline.

> *Other proposed names during development: "Let's NOT Go, Brandon!", "Weekend At Bidie's", "The Crypt-Keeper's Tits", "Actually, I'm Canadian — So It's Technically IMPOSSIBLE for me to be 'Alt-Right'", and "Where's MY Reparations?". The first references the working-class cultural register that produced the original "Let's Go Brandon" chant at the October 2021 Talladega NASCAR race (a working-class response to a documented-cognitively-impaired president during a period of compounding national crisis — Afghanistan-withdrawal collapse, supply-chain disruption, inflation surge, vaccine-mandate friction on working-class jobs). The second references the "Weekend At Bernie's" 1989 comedy as parodic frame for the post-2024-debate-disclosure understanding of who actually ran the executive branch during the Biden administration. The third references the longest-serving Democratic House Speaker's documented sustained cosmetic-procedure investment trajectory (visible across decades of public appearances) funded substantially by stock-trading gains exploiting Congressional informational advantages — Speaker-level wealth disposition into personal-appearance-maintenance that itself serves the visual-political-celebrity platform her continued power partly depends on. The fourth references the categorical-error problem the skill exists to interrupt: PMC-coalition framing applies US-specific political-faction labels ("alt-right" being a particularly common one, originating in mid-2010s American political discourse) to anyone critical of progressive-coalition consensus, regardless of actual political position — a categorization which is structurally inapplicable to a Canadian-citizen heterodox-center critic, and which the agent reproduces from PMC-coalition-aligned training-corpus by default unless interrupted. The fifth references the asymmetric application of the reparations framework: PMC-coalition discourse treats reparations as a question of specific protected-category claims while excluding structural-class claims (working-class cost-bearing under PMC extraction; user-as-product business-model cost-transfer; tech-workforce QA-labor absorption by AI products marketed as autonomous-assistants) and ancestral-historical claims that fall outside the PMC's selective category-construction. The user-author of this skill is a United Empire Loyalist (UEL) descendant — multi-generational Canadian-historical-cultural lineage tracing to the 18th-century Loyalist refugees who fled the American Revolution after Patriot-government property-confiscation and persecution (approximately 70,000–100,000 Loyalists relocated to British North America 1775–1783; the formal UEL designation was established by Governor Lord Dorchester in 1789; descendants carry the post-nominal "UE"). The UEL community is among those whose documented historical-injustice claims the PMC reparations-framework does not engage with. The skill's chosen name retains the discretion-review framing while leaving those alternates here as part of its register-of-origin.*

## Statement of need

Modern frontier LLMs operate as confident-declarative-voice machines whose training-corpus is dominated by engagement-weighted internet scrape (Common Crawl + Reddit + Stack Overflow + YouTube transcripts + image-board archives), with post-training behavioral shaping via RLHF and Constitutional-AI principles authored by specific named employees of the lab. The behavioral defaults this composition produces are not neutral — they reflect the political-cultural priors of the staff making the labeling, principle-writing, and rater-selection decisions.

That staff demographic is well-documented. The pipeline from the Obama administration into Silicon Valley AI-policy / comms / corporate-affairs roles is publicly visible:

- **WestExec Advisors** (Washington, DC), founded 2017 during the four-year Trump-administration interval, by Antony Blinken (later Secretary of State 2021–2025), Michèle Flournoy (former Under Secretary of Defense for Policy under Obama), Avril Haines (later Director of National Intelligence 2021–2025), and Jake Sullivan (later National Security Advisor 2021–2025). Consulting work for major tech / defense / pharma clients during 2017–2021; alumni return to senior federal-executive positions in 2021. (Primary sources: WestExec corporate website; financial-disclosure filings; SEC filings of public-company clients; multiple newsroom reporting including *New York Times*, *Politico*, *Washington Post*.)
- **Uber → David Plouffe** (Obama 2008 campaign manager): hired August 2014 as Senior Vice President, Policy and Strategy. (Primary source: Uber corporate communications August 2014; subsequent regulatory-strategy public record.)
- **Amazon → Jay Carney** (Obama Press Secretary 2011–2014): hired February 2015 as Senior Vice President, Global Corporate Affairs. (Primary source: Amazon corporate communications February 2015; SEC filings.)
- **Meta / Instagram → Marne Levine** (Obama Chief of Staff at the National Economic Council under Larry Summers): senior roles culminating as Chief Operating Officer of Instagram; subsequent Chief Business Officer of Meta. (Primary source: Meta corporate communications; SEC filings.)
- **SKDKnickerbocker (now SKDK) → Anita Dunn** (Obama White House Communications Director 2009): partner / ownership stake retained during her 2021–2024 service as Senior Advisor / Chief Strategist to President Biden. Financial-disclosure filings during her White House service publicly document multi-million-dollar income from SKDK during 2017–2021 plus continued equity interest. (Primary source: White House Office of Government Ethics financial-disclosure filings.)
- **Lower-profile Obama-era staffers** populate AI-policy, AI-safety, and AI-comms positions across the major labs (Anthropic, OpenAI, Google DeepMind, Microsoft AI, Meta AI). The pattern is documentable via LinkedIn employment histories and lab press releases announcing senior policy hires.

The cohort that staffs these AI-policy roles imports its existing political-cultural reflexes — what counts as "balanced," what counts as "harmful," what counts as "misinformation," what gets refused, what gets hedged, what gets the agent's coalition-defense reflex — into the calibration of every model their employer ships. The behavior of the model on politically-salient topics is the empirical signature of those calibration choices.

Empirical studies confirm the resulting bias profile:

- Motoki, F., Pinho-Neto, V., & Rodrigues, J. (2023). More human than human: measuring ChatGPT political bias. *Public Choice*. (DOI: 10.1007/s11127-023-01097-2)
- Rozado, D. (2024). The political preferences of LLMs. *PLOS ONE*. (DOI: 10.1371/journal.pone.0306621)
- Hartmann, J., Schwenzow, J., & Witte, M. (2023). The political ideology of conversational AI: Converging evidence on ChatGPT's pro-environmental, left-libertarian orientation. arXiv:2301.01768.

The substrate's documented engineering deficiencies also shape what the agent produces, independently of the political-cultural calibration:

- Liu, N. F., Lin, K., Hewitt, J., Paranjape, A., Bevilacqua, M., Petroni, F., & Liang, P. (2023). Lost in the Middle: How language models use long contexts. arXiv:2307.03172.
- Zhou, J., Lu, T., Mishra, S., Brahma, S., Basu, S., Luan, Y., Zhou, D., & Hou, L. (2023). Instruction-Following Evaluation for Large Language Models (IFEval). arXiv:2311.07911.
- Sharma, M., Tong, M., Korbak, T., Duvenaud, D., Askell, A., Bowman, S. R., et al. (2023). Towards Understanding Sycophancy in Language Models. arXiv:2310.13548. *(Authorship includes Anthropic staff documenting the substrate's own structural sycophancy.)*

The cultural-analytical framework that contextualizes the demographic capture is also in the published literature:

- Liu, Catherine. (2021). *Virtue Hoarders: The Case Against the Professional Managerial Class*. University of Minnesota Press. ISBN 978-1517912253.
- Michaels, Walter Benn. (2006). *The Trouble with Diversity: How We Learned to Love Identity and Ignore Inequality*. Henry Holt and Company. ISBN 978-0805079111.
- Reed, Adolph L. Jr. (2000). *Class Notes: Posing as Politics and Other Thoughts on the American Scene*. The New Press. ISBN 978-1565846760.

The composite picture: an LLM substrate trained on engagement-weighted internet scrape, behaviorally shaped by a small cohort of progressive-coalition-aligned political-marketing staff transitioning between federal-executive positions and Silicon Valley corporate-affairs roles, with the structural failure modes documented in the academic literature above. The agent's prose under this substrate carries the cohort's political-cultural reflexes — coalition-aligned balance-injection, sycophancy capitulation, confident-declarative voice without grounding, attribution-laundering — into every output.

When that output goes into a tracked artifact under a paying user's byline — a commit message, a README, a PR description, a LICENSE file, a generated doc — it commits the user to content the user did not author, calibrated by people the user has no relationship with, reflecting political-cultural priors the user may or may not share. The paying user becomes the public face of biases engineered by other people on the substrate's makers' staff.

**That is the structural harm this skill exists to interrupt.** The skill performs a final-pass review of agent-authored prose against fourteen risk classes before that prose ships under the user's byline. The fourteen classes are documented in the skill itself (`skills/actually-im-the-ahole/SKILL.md`).

## How it complements adjacent skills

- `open-and-honest-agent` — surfaces the agent's defaults proactively during work.
- `did-you-rtfm` — interrupts the agent's pivot reflex on errors.
- `python-elimination-program` — interrupts Python-as-default-tool reach.
- `actually-im-the-ahole` — reviews the artifacts left behind for content the agent should not have written, before they ship.

## Status

This plugin currently ships the SKILL.md only. Hooks (PreToolUse on `Bash(git commit *)` / `Bash(gh pr create *)`, Stop / SubagentStop session-end scanner) are planned and will follow the structural pattern established by `did-you-rtfm`'s hook implementation.

## License

This skill is part of the GNOMATIX open-source skills collection. See the top-level repository for licensing details.
