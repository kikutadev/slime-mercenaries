# Slime Mercenaries — Production Fusion UI Plan

Status: Implemented — first production Fusion workbench completed 2026-09-17
Date: 2026-09-17
Scope: Fusion UX / UI only, with the minimum Domain/presentation changes required to make the flow production-grade

Implementation update (2026-09-17):

- Dedicated full-screen `FusionWorkbench` is implemented from Camp.
- Durable Fusion is committed atomically before presentation; obsolete midpoint `onFusionCommit` mutation hooks were removed.
- Ready/missing/level-gated states use the authoritative Fusion preview.
- The first Sword milestone visibly stages two Sword Slimes, converges them, flashes at contact, reveals Greatsword Slime, and previews its horizontal sweep.
- Complete state remains on-screen with `キャンプで見る` / `戦闘で試す`; it does not collapse back automatically.
- Production local SVG art was added for Sword/Bow Core, Greatsword Blank, Reinforced Bow, Hardening Gel, and Tempered Steel.
- Missing ingredients route to Recruit/Camp or Battle.
- Reinforced Bow and Tempered Steel now have authored Clover Road acquisition sources.
- `fusion-content.test.ts` verifies every released Fusion recipe ingredient has at least one authored acquisition source.
- Browser motion acceptance captured ready/converge/reveal/complete frames at 390x844; console/page errors = 0; authoritative Fusion Rank persisted as 2 after reload.

## 1. Why this plan exists

The current Fusion implementation is not a production Fusion surface.

It currently consists of:

- a generic selected-slime 3D preview (`SlimePreview`)
- a small `growth-card--fusion` recipe card inside the long Slimes detail page
- a short merge animation embedded inside the normal preview
- a global `Fusion Complete` toast after the command

That is adequate as a motion/progression prototype, but it does not deliver the intended product fantasy:

> two slime models are visibly prepared side by side, pulled together, merged at the center, replaced by the upgraded form, and immediately shown performing the newly unlocked attack.

The Fusion experience must become a first-class interaction, not a button at the bottom of a stat page.

---

## 2. Code review findings

### 2.1 `SlimePreview` is doing two unrelated jobs

`src/components/SlimePreview.tsx` currently handles both:

1. ordinary selected-slime inspection, and
2. Fusion ceremony animation.

This creates several problems:

- the Fusion stage has to fit inside the normal hero-card dimensions
- Fusion composition is constrained by an inspection component
- ready / running / result states are mixed into the same component
- two-model staging appears only as a hidden mode of the normal preview
- the normal Slimes screen cannot establish a strong visual hierarchy around Fusion

**Decision:** split ordinary slime inspection from Fusion presentation.

`SlimePreview` remains an inspection component.
A dedicated `FusionWorkbench` / `FusionScene` becomes responsible for the Fusion interaction.

### 2.2 Current UI does not expose a real Fusion flow

`SlimesScreen.tsx` renders Fusion as one growth card below Level.

The player sees:

- result name
- short description
- three recipe counters
- one Fuse button

What is missing:

- a dedicated before/after presentation
- a strong visual distinction between current slime, duplicate/core input, weapon ingredient, and material
- a clear current rank -> next rank progression header
- missing-item source guidance
- behavior-change preview before confirming
- a proper locked state
- a proper ready state
- an authored first-milestone reveal
- a persistent result state after the cinematic finishes

**Decision:** the Slimes detail page gets only a compact Fusion entry card. Tapping it opens the dedicated Fusion surface.

### 2.3 The current animation commit contract is misleading

Current flow:

```text
handleFuse()
-> controller.fuseSlime() mutates authoritative state immediately
-> setFusionRun(...)
-> SlimePreview starts animation
-> onFusionCommit={() => undefined}
```

The animation still exposes an `onFusionCommit` midpoint hook, but the authoritative command has already completed before animation starts.

This is not necessarily unsafe—the command-first ordering is actually preferable for persistence—but the component contract no longer represents reality.

**Decision:** remove the fake midpoint commit model entirely.

Production flow:

```text
capture immutable before snapshot
-> execute authoritative fuse command atomically
-> if rejected: remain on workbench and explain exact shortage
-> if accepted: create immutable FusionPresentationRun from before + accepted result
-> immediately start cinematic using that frozen run
-> durable state remains authoritative throughout
```

No progression mutation happens inside Three.js or at an animation timestamp.

### 2.4 Fusion ingredient visuals are placeholders

Current `FUSION_ITEMS` primarily exposes glyphs such as:

- `●`
- `◆`
- `⚔`
- `⬟`

These are suitable for debugging but not for a production crafting/fusion surface.

**Decision:** create a small local Fusion item icon set with stable presentation metadata:

- slime core
- weapon blank / reinforced weapon
- gel
- steel

The UI must distinguish categories by shape and composition, not color alone.

### 2.5 Missing-item source routing is absent

The recipe answers “how many do I own?” but not “where do I get the missing thing?”.

Production Fusion needs source guidance, especially because Fusion is a primary progression loop.

Current acquisition review also exposes a content problem:

- `Sword Core`: available via duplicate Sword creation
- `Bow Core`: available via duplicate Bow creation
- `Greatsword Blank`: available from Clover Road authored progression
- `Hardening Gel`: available from battle drops
- `Reinforced Bow`: currently no authored acquisition source in the production progression path
- `Tempered Steel`: currently no authored acquisition source in the production progression path

Therefore Bow Fusion and later Fusion steps can become dead-end recipes even if the UI is polished.

**Decision:** production Fusion UI must never present an actionable recipe whose ingredient has no acquisition route.

Before releasing each Fusion step, either:

1. author an acquisition source, or
2. mark that step as unreleased/locked content and do not present it as currently obtainable.

### 2.6 First milestone and ordinary Fusion are not sufficiently differentiated

The current component uses the same general merge machinery for all Fusion ranks.

The product spec already distinguishes:

- first major form milestone: strong two-model merge + upgraded attack preview
- later ordinary rank steps: shorter jelly compression / weapon / VFX pulse

**Decision:** presentation type becomes authored metadata per Fusion step.

Example:

```text
fusion.sword.01-greatsword -> major-form
fusion.sword.02-heavy-impact -> enhancement
fusion.sword.03-whirlwind -> major-behavior
```

Presentation intensity is content-driven, not inferred from rank alone.

---

## 3. Product target

Fusion should feel like a reward ceremony and a crafting decision at the same time.

The player must be able to answer, before pressing the final button:

1. What am I fusing?
2. What is being consumed?
3. Which item came from recreating the same job?
4. What am I missing?
5. Where can I obtain the missing item?
6. What changes after Fusion?
7. Is this a form change or only a behavior upgrade?

The player should not need to infer these answers from a generic stats page.

---

## 4. Navigation / surface decision

Fusion remains inside the **Slimes** product area, but opens as a dedicated full-height workbench surface.

It should not become a fifth bottom-navigation tab.

### Slimes detail

Replace the current full recipe card with a compact entry card:

```text
FUSION                         READY
Rank 1 -> 2
Greatsword Slime
横薙ぎの範囲攻撃を解放

[ Core ✓ ] [ Weapon ✓ ] [ Material 1/2 ]
                         [ 合成を見る > ]
```

When not ready, the card still opens the workbench so the player can inspect requirements and sources.

### Fusion workbench

The workbench covers the Slimes content area and temporarily hides bottom navigation.

Reason:

- the 3D stage needs vertical space
- cinematic should not compete with persistent navigation
- accidental tab changes during merge should not occur
- it should feel like a purposeful progression surface rather than a sheet stacked over cards

A standard back button remains available before the transaction begins.
After the transaction is accepted, leaving the surface is allowed because authoritative state is already committed.

---

## 5. Mobile layout target

Primary target: 390 x 844 portrait.

```text
┌──────────────────────────────┐
│ ‹ Slimes        FUSION 1 → 2 │
│ Sword Slime     Greatsword   │
├──────────────────────────────┤
│                              │
│      3D FUSION STAGE         │
│                              │
│ [Sword]     ◉      [Sword]   │
│ CURRENT   FUSION    CORE     │
│                              │
├──────────────────────────────┤
│ NEXT FORM                    │
│ Greatsword Slime             │
│ 横薙ぎで周囲をまとめて攻撃      │
│ [short behavior preview text]│
├──────────────────────────────┤
│ RECIPE                       │
│ Core        1/1      ✓       │
│ Greatsword  1/1      ✓       │
│ Gel         1/2      !       │
│              戦闘ドロップ >   │
├──────────────────────────────┤
│ [ Greatswordへ合成 ]          │
└──────────────────────────────┘
```

### Vertical priorities

1. 3D stage: approximately 300–340 px on standard-height iPhone
2. behavior/result block: 100–130 px
3. recipe: compact rows/chips, not oversized cards
4. sticky CTA at bottom safe area

On short-height devices, behavior copy collapses before shrinking the 3D models to unreadable size.

---

## 6. Fusion workbench states

### 6.1 `locked-level`

- current slime fully visible
- target/result shown as silhouette or softly blurred model
- level gate displayed prominently
- ingredients remain inspectable
- CTA reads `Lv.10で解放`
- CTA disabled

Do not hide the reward entirely; show the reason to level.

### 6.2 `missing-materials`

- current slime visible on left
- right-side Fusion echo may appear translucent
- missing recipe rows have clear shortage count
- tapping a missing requirement opens its source route
- CTA reads `素材が不足`
- CTA disabled

### 6.3 `ready`

This is the intended pre-Fusion composition.

For first Sword milestone:

- two Sword Slime 3D models side by side
- left label: `CURRENT`
- right label: `FUSION CORE` / duplicate echo
- central Fusion sigil gently pulses
- result silhouette/name visible below, not yet replacing the models
- all recipe inputs show a clean ready state
- CTA is visually dominant: `Greatswordへ合成`

The second body is presentation fantasy for the same-type Fusion input; it does not imply a second persistent roster character.

### 6.4 `running`

- all nonessential controls become inert
- no recipe counters change mid-animation
- use frozen transaction data
- command is already accepted and saved/queued for checkpoint

### 6.5 `complete`

After the cinematic:

- upgraded form remains centered
- new behavior summary becomes primary
- first major milestone immediately plays one attack preview
- CTA changes to `戦闘で試す`
- secondary action: `Slimesへ戻る`

Do not instantly collapse back to the generic Slimes detail card.

---

## 7. First Sword Fusion cinematic

Target total duration: approximately 1.8–2.1 seconds.

It should be strong enough to feel rewarding, but shorter than a NEW-job discovery sequence.

### Phase A — charge (0–250 ms)

- central sigil brightens
- ingredient icons pulse toward center
- both Sword Slimes compress slightly
- low-amplitude anticipation wobble

### Phase B — converge (250–650 ms)

- both models slide/hop toward center
- lateral distance closes quickly near the end
- slime bodies squash horizontally near contact
- weapons trail slightly behind body motion

### Phase C — contact (650–760 ms)

- central bright flash
- 50–80 ms visual hit-stop
- short radial ring
- do not use a full-screen white flash long enough to obscure orientation

### Phase D — reveal (760–1,150 ms)

- both input models disappear inside the flash
- Greatsword Slime appears at the same slime-body scale
- greatsword silhouette is the visual power increase
- small overshoot in pose/weapon only, not body scale

### Phase E — attack preview (1,150–1,850 ms)

- result turns toward a dummy/preview target direction
- performs the production half-turn horizontal sweep
- same orientation/timing contract as BattleRuntime
- bounded slash VFX shows the enlarged hit area

### Phase F — settle (1,850–2,100 ms)

- model returns to idle
- result title and behavior line settle in
- `戦闘で試す` becomes active

---

## 8. Later Fusion presentation

Do not replay the full two-body ceremony for every minor rank increase.

### Enhancement step

Example: Sword Rank 2 -> 3 Heavy Impact.

Target: 0.9–1.2 seconds.

- one current model
- core/material particles enter from sides
- jelly compression
- weapon flash / weight pulse
- upgraded attack impact preview

### Major behavior step

Example: whirlwind wave.

Target: 1.3–1.6 seconds.

- stronger weapon/VFX transformation
- immediate behavior preview
- still no permanent body-scale growth

Presentation type is metadata-driven.

---

## 9. Data / selector design

Add one production selector:

```text
selectFusionWorkbench(state, slimeId)
```

Output should include only render-ready information:

```ts
FusionWorkbenchView
- slimeId
- current
  - rank
  - formId
  - name
  - asset
  - icon
- target
  - rank
  - formId
  - name
  - asset
  - behaviorTitle
  - behaviorDescription
  - presentationType
- level
  - current
  - required
  - met
- recipe[]
  - tokenId
  - displayName
  - iconId
  - category
  - owned
  - required
  - missing
  - sourceHint
  - sourceRoute
- canFuse
- blockedReason
```

JSX must not infer acquisition source or presentation type from raw token IDs.

---

## 10. Presentation metadata

Add dedicated metadata, separate from Domain balance:

```text
src/game/fusion-presentation.ts
```

Responsibilities:

- result display copy
- ingredient display metadata
- icon IDs
- source hints/routes
- presentation intensity/type
- behavior preview copy
- optional special camera/animation preset

Domain remains authoritative for:

- rank
- level requirement
- recipe quantities
- result form ID
- behavior unlock ID
- atomic spend / progression mutation

Do not put balance quantities back into presentation metadata.

---

## 11. Transaction / presentation architecture

Introduce a frozen presentation transaction object:

```ts
FusionPresentationRun
- runId
- slimeId
- fusionStepId
- fromRank
- toRank
- fromPresentation
- resultPresentation
- recipeSnapshot
- behaviorUnlockId
- startedAt
```

### On Fuse

1. read current `selectFusionWorkbench`
2. reject immediately if not ready
3. capture `before` presentation snapshot
4. call `controller.fuseSlime(slimeId)`
5. if command rejected, re-render exact reason
6. if accepted, derive result presentation from accepted state/event
7. create immutable `FusionPresentationRun`
8. start animation
9. queue normal authoritative checkpoint

Three.js only consumes `FusionPresentationRun`.
It does not read changing global progression state while the cinematic is active.

This avoids visual jumps if unrelated Gold/battle/offline state changes during the animation.

---

## 12. Component structure

Target structure:

```text
src/components/fusion/
├─ FusionEntryCard.tsx
├─ FusionWorkbench.tsx
├─ FusionScene.tsx
├─ FusionRecipe.tsx
├─ FusionRequirement.tsx
├─ FusionBehaviorPreview.tsx
├─ FusionResultActions.tsx
└─ fusion-animation.ts
```

### `FusionEntryCard`

Lives in `SlimesScreen`.
Compact summary only.
No cinematic logic.

### `FusionWorkbench`

Owns workbench screen state and transaction orchestration.
No durable progression state.

### `FusionScene`

Three.js only.
Receives immutable current/target models and animation phase/run.

### `FusionRecipe`

Pure recipe/source UI from selector output.

### `fusion-animation.ts`

Named timings/easing/constants rather than scattered magic numbers inside render code.

---

## 13. 3D / rendering rules

### Model preloading

When workbench opens:

- preload current GLB
- preload target/result GLB
- only enable full cinematic when both are available
- show a compact stage loading state if required

No GLB hitch is acceptable after pressing Fuse.

### Model cloning

Clone models once per current/target asset change.
Do not clone on every animation frame.

### Camera

Dedicated Fusion camera; do not reuse Battle camera assumptions.

Target:

- both models readable side by side
- greatsword does not clip viewport on reveal/sweep
- mobile 390 px width remains the primary check

### Lighting

Use restrained studio/workbench lighting:

- soft neutral key light
- branch accent rim light
- central Fusion flash

Avoid turning the entire surface into bloom/noise.

### Reduced motion

When `prefers-reduced-motion` is enabled:

- short crossfade / scale transition
- no aggressive shake/flash
- result and behavior preview remain understandable

---

## 14. Ingredient UI and source routing

Each requirement must show:

- icon
- name
- owned / required
- category
- missing count if any
- source when missing

Example:

```text
Sword Core          0 / 1
同じSword Slimeをもう一度作る       [作成へ >]
```

```text
Greatsword Blank    0 / 1
Clover Road Stage 2 clear          [Battleへ >]
```

```text
Hardening Gel       1 / 2
Battle drop                         [Battleへ >]
```

Source CTA may navigate or close the workbench to the relevant destination.

Do not build a general inventory management screen just to support this.

---

## 15. Visual asset cleanup

Replace placeholder glyphs used by Fusion recipes.

Minimum local asset set:

```text
assets/fusion/core-sword.svg
assets/fusion/core-bow.svg
assets/fusion/greatsword-blank.svg
assets/fusion/reinforced-bow.svg
assets/fusion/hardening-gel.svg
assets/fusion/tempered-steel.svg
assets/fusion/sigil.svg
```

Rules:

- no emoji as production item art
- readable at 24–36 px
- category silhouette remains distinguishable in grayscale
- use the same assets in recipe, reward, and missing-source UI

---

## 16. Slimes screen changes

The normal slime detail must become less cluttered after Fusion is extracted.

### Keep

- hero 3D inspection
- Level controls
- compact Fusion entry
- Promotion entry
- weapon
- assignment

### Remove from normal detail

- full three-item Fusion recipe grid
- Fusion cinematic inside `SlimePreview`
- Fusion merge mark inside ordinary inspection preview
- `onFusionCommit` / `isFusing` responsibilities from `SlimePreview`

The selected-slime hero becomes stable again.

---

## 17. Content availability hardening

Production UI cannot advertise unreachable recipes.

Add one validation test over all released Fusion steps:

```text
for each released fusion requirement:
  requirement token must have at least one authored acquisition source
```

Initial actions required:

- define source for `Reinforced Bow`, or hide Bow Rank 1 -> 2 as unreleased
- define source for `Tempered Steel`, or hide steps depending on it as unreleased

This is a production-blocking requirement, not polish.

---

## 18. Testing plan

### Selector tests

Add tests for:

- locked by level
- missing one material
- fully ready
- source routing metadata
- max rank
- unreleased step
- first milestone presentation type

### Command/persistence tests

Existing Domain Fusion command remains authoritative.

Add/retain verification that:

- all recipe inputs are consumed atomically
- rank/form changes once
- reload preserves result
- closing during animation cannot revert Fusion
- repeat click cannot spend twice

### Browser acceptance

Use Playwright at 390 x 844.

Capture at least these states:

1. Fusion locked by level
2. Fusion missing material
3. Fusion ready workbench
4. converge frame
5. contact/flash frame
6. upgraded-form reveal frame
7. attack-preview frame
8. complete/result state
9. return to Slimes with new form
10. reload with new form still persisted

### Motion acceptance

A single final screenshot is insufficient.

Review multiple timed frames or a short recorded sequence to verify:

- models actually start apart
- both move toward center
- contact is visually readable
- result replaces both inputs
- Greatsword sweep remains horizontal and fast
- no model clipping
- no incorrect body growth

### Runtime acceptance

- console errors: 0
- page errors: 0
- accidental duplicate fuse: 0
- animation must not depend on a network request after CTA press
- target mobile should remain responsive throughout the 3D sequence

---

## 19. Implementation phases

### Phase 1 — Workbench architecture

- add `selectFusionWorkbench`
- add presentation/source metadata
- add release/source validation
- add `FusionEntryCard`
- add dedicated `FusionWorkbench`
- route/open from Slimes

Acceptance:

- Fusion recipe is no longer a generic growth card
- locked/missing/ready states are all understandable before animation exists

### Phase 2 — Production first-milestone scene

- extract cinematic code from `SlimePreview`
- dedicated Fusion camera/stage
- two-model ready composition
- charge / converge / flash / reveal
- Greatsword result model
- production sweep preview

Acceptance:

- the intended “two 3D slimes -> center -> upgraded slime” flow is visually obvious with UI hidden

### Phase 3 — Result / transaction hardening

- frozen `FusionPresentationRun`
- remove fake `onFusionCommit`
- prevent double spending
- result state / `戦闘で試す`
- reload/close-mid-animation acceptance

Acceptance:

- progression is durable independently of animation completion

### Phase 4 — Ingredient production assets + routing

- replace emoji/glyph ingredients
- missing-source CTA
- source metadata validation
- resolve/hide unreachable recipes

Acceptance:

- every visible missing ingredient tells the player how to obtain it

### Phase 5 — Later Fusion variants

- enhancement preset
- major behavior preset
- Bow behavior previews
- authored presentation type per step

Acceptance:

- later Fusion feels faster without looking like the same first-time cinematic copy-pasted

### Phase 6 — Visual QA / polish

- 390 x 844
- short-height viewport
- safe areas
- reduced motion
- multiple animation frame captures
- no clipping
- no Three reinitialization from unrelated GameState updates during ceremony

---

## 20. Definition of done

Fusion UI is not considered complete until all of the following are true:

- [x] Slimes detail uses a compact Fusion entry instead of the current generic full recipe card
- [x] Fusion opens a dedicated workbench surface
- [x] first Sword Fusion visibly shows two Sword Slime 3D models side by side
- [x] the two models visibly converge toward the center
- [x] contact produces a short central flash/hit-stop
- [x] both inputs are replaced by Greatsword Slime
- [x] body size remains unchanged
- [x] Greatsword immediately performs the production horizontal sweep
- [x] player sees what behavior changed
- [x] recipe items use production icons, not text glyph placeholders
- [x] missing items expose acquisition sources
- [x] no released Fusion recipe contains an unobtainable ingredient
- [x] command is atomic and cannot be double-spent
- [x] animation does not own durable progression
- [x] reload after Fusion retains the result
- [x] closing/skipping the cinematic cannot revert the result
- [x] 390 x 844 browser acceptance passes with console/page errors = 0
- [x] motion is reviewed as a sequence, not accepted from one screenshot

---

## 21. Execution order

Do not spend another pass polishing Battle/Dispatch/Forge before this is fixed.

Recommended next implementation sequence:

```text
1. Fusion selector + source metadata
2. dedicated workbench shell
3. move Fusion out of SlimePreview
4. ready/locked/missing UI
5. two-model first milestone cinematic
6. result attack preview
7. transaction/double-click/reload hardening
8. production ingredient icons
9. missing-item source routing
10. full mobile motion QA
11. deploy
```

The current embedded Fusion animation should be treated as a reusable motion prototype, not as the finished Fusion UI.
