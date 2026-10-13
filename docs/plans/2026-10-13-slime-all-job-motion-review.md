# Slime Mercenaries — 25-job animation visual review

Date: 2026-10-13
Status: Previous general animation release verified; **defeat-eye placement acceptance withdrawn** (see `2026-10-13-defeat-eye-surface-regression.md`)

## Player value and acceptance

Every job should express its role and growth through anticipation, execution, impact and recovery at actual mobile size. The jelly body must remain consistently sized while alive; defeat must visibly squash into the ground with readable XX eyes and equipment that does not float above a collapsed body.

This pass reviews the **actual 25 GLB models** in the running gallery (six weapon families, Tier 1/2/3 specializations, plus Greatsword). This is not a claim that all 25 had their animations fully rebuilt: problems that were materially visible received code changes, while existing authored signatures were preserved when their timing and silhouettes were already legible.

## 25 character reviews

| Job | Reviewed behavior and verdict |
| --- | --- |
| Sword | Single wind-up and slash remains discernible; retained. |
| Fighter | Two connected sword beats distinguish Tier 2; retained. |
| Blademaster | Pass-through, pause and delayed slash present; retained after earlier line-length cleanup. |
| Berserker | Compression, impact ring and committed recovery visible; retained. |
| Shield | Restrained short-range shove remains Tier-1 baseline. |
| Guardian | Previously too similar to Shield in body timing. **Changed:** stronger planted brace, shield lift and more restrained travel. |
| Paladin | Shield flash then sanctuary visible; retained. |
| Fortress | Planted heavy defense and ground shockwave visible; retained. |
| Bow | Single arrow flight visible; retained. |
| Ranger | Two-shot motion sequence visibly distinct from Bow; retained. |
| Sniper | Long targeting and piercing release visible; retained. |
| Storm Archer | Charged multi-arrow volley visible; retained. |
| Wand | A small orb follows basic cast; retained. |
| Mage | Cast sigil gives Tier-2 distinct identity; retained. |
| Archmage | Grand circle, meteor and impact distinct; retained after previous area/opacity cleanup. |
| Frost Mage | Charged lance then freeze/ice field visible; retained. |
| Dagger | Compressed fast stab baseline; retained. |
| Rogue | Alternating double dagger hits visible; retained. |
| Ninja | Vanish/afterimage and delayed slashes visible but too white. **Changed:** normal-blended smoke and tapered cut geometry. |
| Assassin | Approach and execute distinct but exposed bright rectangular effects. **Changed:** ring flash, tapered strike lines. |
| Gun | One short shot/recoil establishes baseline; retained. |
| Gunner | Triple gunfire exists but each recoil was too similar/weak. **Changed:** alternating lean/sweep and stronger per-shot punch with unchanged release times. |
| Cannoneer | Heavy shell/tracer/impact clearly different from Gunner; retained. |
| Engineer | Assembly and turret release distinct but white square effects obscured the character. **Changed:** hollow activation/energy rings, normal-blended assembly parts and less glare. |
| Greatsword | Half-turn area crescent distinct from Sword; retained after previous compact-arc cleanup. |

## Gallery and shared defeats

- Front camera previously faced away from the slime. Gallery front view now shows the eyes; authored gameplay facing remains unchanged.
- Added bounded `?frame=0..1` review pause, allowing deterministic animation phase review without unreliable fixed delays.
- The previous review claimed defeat X eyes were corrected. **That claim was false.** Its workaround made the eyes hover outside the flattened body; the tests checked presence and scale rather than facial attachment. The specific corrected implementation and new screenshot evidence are recorded in `2026-10-13-defeat-eye-surface-regression.md`. The shared root squash and equipment collapse were retained, but the X-eye approval is not part of this earlier signoff.
- QA captured **25×3=75 live attack samples** for initial diagnosis; then **25×5=125 deterministic actual attack frames** across 12/35/56/72/91% normalized progress; plus **25×3=75 defeat frames** before and after the shared defeat fix, with contact sheets manually inspected. HTML/PNG evidence resides locally under `.tmp/slime-motion-*` and is not source-controlled.

## Further art production, not falsely accepted

Individual profession-specific idle/move cycles, bespoke additional secondary body motion across all GLBs and dedicated asset reauthoring remain further improvement candidates. These are not counted as completed merely because a gallery sequence played and tests passed. Longer session combat camera and hit visibility should also be revisited during further battle polish.

## Release QA

- Full Vitest: **86 test files / 511 cases PASS** (4.37s); 2 initial failures exposed Guardian overshooting Tier 3 impact and were resolved before this acceptance run.
- TypeScript PASS (4.56s), UI contract PASS, Vite production build PASS (3.09s), initial script gzip **135.9 KiB** under 160 KiB limit (0.38s).
- Real mobile CFT normal first-play 390×844: **15 captures / seven checks / zero errors, PASS** (35.19s).
- Dispatch started and ten Forge results inspected at 390×844: **PASS** (4.66s).
- Tier 3 six-job runtime battle smoke on Clover Road and Dragon Crater boss at 390×844: **2 actual live scenes PASS**, frames captured (17.08s).
- 25 distinct GLBs: 125 normalized attack frames and 75 final defeat frames individually inspected in contact sheets; front view shows eyes.
- No GitHub Actions invoked. Tests, builds and browser QA ran locally.

## Production release acceptance

- Implementation commit `bad756a` pushed to `origin/main`.
- Cloudflare Worker deployed as `8b291fcd-fc48-44cc-9519-dbcd4b61c494` on `https://games.kikuta.dev/slime-mercenaries/`.
- Custom domain serves new `main-CyEGiYJN.js` and `BattleScreen-D2MkhSzf.js` (HTTP 200).
- Public normal first-play Chrome for Testing at **390×844**: **PASS**, 15 screenshots, 7 assertions, zero errors, **37.29s**.
- Public gallery all 25 **attack ×5** normalized poses: 125 real captures and zero errors, **52.17s**.
- Public gallery all 25 **defeat ×3** normalized poses: 75 real captures and zero errors, **41.77s**. A production Archmage defeat sample was manually inspected and confirmed its hat and staff lie with the flattened jelly body while XX eyes remain visible.
- Both game and portal projects use local builds/tests, without GitHub Actions. Other game source trees were not edited.
