# Combat VFX concurrency and Tier 3 legibility

Date: 2026-10-13
Status: Implemented; local acceptance PASS, release pending

## User-visible problem

After layout and late-stage combat framing were corrected, simultaneous skills were still unreliable. `SwordCombatFamily` stored one sword slash arc and one greatsword arc for all six slots. An idle attacker or a new attack could hide/overwrite the arc produced by another slime. Six-sword testing also exposed portrait-edge clipping and giant greatsword circles. A six-branch Tier 3 test showed the Archmage/Blademaster/Paladin signature VFX covering enemy silhouettes for too much of their lifetime.

## Product requirements

- Every sword/greatsword attacker owns its own independent slash, at most six slot instances; an idle or finished attacker never hides another actor's active trail. Reset all transient trails at encounter results.
- Same-type slimes must remain freely assignable in all six slots; no change to body size, actual damage, targeting, attack intervals, stage progression or HP.
- Keep routine hits modest and brief, with an unmistakable but bounded stronger-hit starburst; no screen-filling generic explosions.
- Give greatswords a compact open horizontal crescent rather than a 360-degree enclosing circle. Keep the sword versus greatsword difference legible.
- Keep Tier 3's unique beats: Blademaster delayed cut, Archmage rune convergence/meteor/impact, Paladin shield strike/sanctuary. Bound VFX footprints and opacity so boss and party silhouettes remain legible in a portrait crowd.

## QA evidence and release gates

- Chrome for Testing 390×844: six same-job swords with mixed ordinary/greatsword ranks, 18 sampled frames; after changes all six body silhouettes are visible within frame and more than one slash can coexist.
- Chrome for Testing 390×844: Tier 3 six-branch configuration (Blademaster, Paladin, Sniper, Archmage, Ninja, Cannoneer) at Clover Road stage 5 and Dragon Crater boss wave, 16 sampled frames each; compared before/after coverage. Signature variety remains; huge full-screen line/circle treatments reduced.
- Dedicated concurrent arc ownership test, capped hit-impact presentation tests, compact crescent test, Tier 3 signature regression assertions.
- Final gates: typecheck, UI contract, full unit tests, bundle guard, first-play browser QA and late boss scene QA; game portal deploy and public smoke afterward.

## Remaining art-direction work

- Dedicated authored model-by-model animation/motion capture review (including each Tier 3 specialization) is a distinct future art pass. This change addresses runtime concurrency and legibility without claiming every character's authored animation has been individually reworked.

## Local acceptance results

- 390×844 six same-family swords, mixed Sword/Greatsword: 18 frames captured and reviewed, 9.11s for compact-crescent capture. All six slimes remain legible, and owner-specific slash effects can coexist.
- 390×844 Tier 3 six-branch squad: 16 sampled frames each at Clover Road stage 5 and Dragon Crater boss, captured and reviewed; final recheck 16.56s. Visual hierarchy significantly improved, although Tier 3 spells remain deliberately vivid.
- 390×844 staged late-boss capture (Clover + Frost + Ember + Moonlit + Dragon): PASS, 12.80s.
- Fresh normal mode 390×844 first-play browser acceptance: PASS, 15 screenshots / 7 assertions, 35.22s, zero game-origin errors. 430×932: PASS, 15 screenshots / 7 assertions, 35.23s, zero game-origin errors.
- Full Vitest: 86 files / 504 cases PASS in 5.48s. TypeScript PASS 3.87s, UI contract PASS 0.37s, production build PASS 2.87s, initial bundle guard PASS 0.38s, 135.9KiB gzip / 160KiB budget.
