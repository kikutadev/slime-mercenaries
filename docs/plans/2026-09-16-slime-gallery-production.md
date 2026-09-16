# Slime Model & Motion Gallery — Production Plan

Status: Planned
Date: 2026-09-16

## 1. Goal

30 discoverable slime forms plus non-Codex fusion presentation forms such as Greatsword Slime are produced one by one, reviewed in an isolated model/motion gallery, and only accepted builds are published under the existing public `slime-mercenaries` repository.

The public repository receives build output only. Source Blender Python, gallery source, design documents, and development QA remain in the private development repository.

Target public layout:

```text
/slime-mercenaries/
  index.html              game build
  gallery/
    index.html            model / motion gallery build
    assets/...            accepted gallery assets only
```

## 2. Source of truth

Per-slime content briefs live in:

```text
docs/content/slimes/
```

Each file owns the content-specific design for one form:

- silhouette and equipment
- material / accent intent
- idle and locomotion
- basic attack timing and hit shape
- skill/signature motion
- hit reaction
- defeat reaction
- celebrate / march behavior
- VFX language
- gallery acceptance checklist

These briefs are subordinate to the product-level contracts in `docs/specs/art-direction.md`, `docs/specs/combat.md`, and `docs/specs/evolution-roster.md`.

## 3. Why no worktrees are required

Parallel work is safe only when file ownership is disjoint.

Do not have multiple workers edit one monolithic Blender generator or one hand-maintained gallery registry.

Before bulk production, refactor toward:

```text
tools/blender/slimes/
  common.py
  plain.py
  sword.py
  greatsword.py
  fighter.py
  ...

src/gallery/slimes/
  plain.ts
  sword.ts
  greatsword.ts
  fighter.ts
  ...
```

The gallery must auto-discover per-slime definitions (for example via Vite glob imports) rather than requiring every worker to edit a shared `registry.ts`.

Each worker owns only its assigned branch files and generated assets. Workers do not commit. The coordinator performs integration, builds, QA, and commits after all parallel jobs complete.

## 4. Shared foundation — serial, first

This phase must complete before parallel asset implementation.

1. Add gallery route/application under a separate build entry.
2. Add a reusable gallery stage using the same Three.js visual/runtime conventions as the game.
3. Support controls:
   - Idle
   - Move
   - Basic Attack
   - Skill
   - Hit
   - Defeat
   - Celebrate
   - Evolution/Fusion preview when applicable
   - 0.5x / 1x / 2x playback
   - loop on/off
   - gameplay camera / front-ish inspection / free orbit
4. Add target dummy support for melee hit, projectile, AoE, knockback, hit-stop, and defeat readability.
5. Extract Blender reusable base helpers from the monolithic generator without changing accepted Sword/Bow appearance.
6. Establish per-slime manifest/definition format.
7. Make gallery discovery automatic so adding one slime does not require editing shared source.
8. Add a build command that emits gallery output separately from the main game build.
9. Add a publish script that copies only built output into the public repository's `/gallery/` path.

## 5. Parallel design-document creation

Design files are independent and can be authored simultaneously without worktrees.

Suggested ownership:

- Worker A — Plain + Sword branch + Greatsword fusion form
- Worker B — Shield branch
- Worker C — Bow branch
- Worker D — Wand branch
- Worker E — Dagger branch
- Worker F — Gun branch
- Worker G — Rare mutations

No worker edits shared current-spec documents during this phase. Any cross-cutting findings are returned to the coordinator, who updates shared specs once.

## 6. Parallel model/motion implementation

After the shared foundation is stable, use the same branch ownership.

### Worker A — baseline / Sword

- Plain Slime
- Sword Slime
- Greatsword fusion form
- Fighter Slime
- Blademaster Slime
- Berserker Slime

### Worker B — Shield

- Shield Slime
- Guardian Slime
- Paladin Slime
- Fortress Slime

### Worker C — Bow

- Bow Slime
- Ranger Slime
- Sniper Slime
- Storm Archer Slime

### Worker D — Wand

- Wand Slime
- Mage Slime
- Archmage Slime
- Frost Mage Slime

### Worker E — Dagger

- Dagger Slime
- Rogue Slime
- Ninja Slime
- Assassin Slime

### Worker F — Gun

- Gun Slime
- Gunner Slime
- Cannoneer Slime
- Engineer Slime

### Worker G — Mutations

- King Slime
- Golden Slime
- Dragon Slime
- Prism Slime
- Mimic Slime

Each worker may generate GLBs concurrently because output filenames are unique. Workers must not run the final gallery build or deploy step while another worker is mutating source.

## 7. Publication order

Implementation may be parallel, but acceptance and public exposure are ordered. A later slime can be finished early and remain unpublished until its release gate is reached.

### Wave 0 — prove the pipeline

1. Plain Slime
2. Sword Slime
3. Greatsword fusion form
4. Bow Slime

This wave validates base jelly motion, melee, AoE sweep, ranged projectile, defeat, and the gallery itself.

### Wave 1 — Tier 1 vocabulary

5. Shield Slime
6. Wand Slime
7. Dagger Slime
8. Gun Slime

After this wave, all six primary combat motion languages exist.

### Wave 2 — Tier 2

9. Fighter Slime
10. Guardian Slime
11. Ranger Slime
12. Mage Slime
13. Rogue Slime
14. Gunner Slime

### Wave 3 — Tier 3 Sword / Shield / Bow

15. Blademaster Slime
16. Berserker Slime
17. Paladin Slime
18. Fortress Slime
19. Sniper Slime
20. Storm Archer Slime

### Wave 4 — Tier 3 Wand / Dagger / Gun

21. Archmage Slime
22. Frost Mage Slime
23. Ninja Slime
24. Assassin Slime
25. Cannoneer Slime
26. Engineer Slime

### Wave 5 — mutations

27. King Slime
28. Golden Slime
29. Dragon Slime
30. Prism Slime
31. Mimic Slime

The public gallery can show `Coming soon` cards for future entries, but only accepted GLBs and runtime motions may be interactively playable.

## 8. Per-slime acceptance gate

A slime is publishable only when all applicable checks pass at real speed and at gameplay scale.

1. Silhouette remains identifiable at portrait gameplay size.
2. It still reads as a slime without its equipment.
3. Idle has soft jelly life and does not look frozen.
4. Move uses squash/stretch rather than humanoid walking.
5. Attack source and target are visually obvious.
6. Weapon orientation is physically believable during the damaging frame.
7. Attack anticipation is readable without making combat sluggish.
8. Release/impact has sufficient speed and hit-stop where appropriate.
9. Skill geometry matches gameplay behavior: single target / line / cone / radius / projectile / summon.
10. Hit reaction is directional and returns cleanly to the combat anchor.
11. Defeat visibly ends in `flatten + × eyes` and remains readable long enough.
12. Equipment does not clip badly through the body during key frames.
13. Camera-facing and asymmetrical equipment are correct in the actual 3/4 game view.
14. No permanent body-scale growth is introduced for fusion rank.
15. Gallery playback at 0.5x, 1x, and 2x remains stable.
16. No new runtime console errors.
17. Main-game build remains green.

## 9. QA evidence

For each accepted slime, preserve lightweight evidence outside the public repo:

```text
.acceptance/slimes/<slug>/
  gameplay-idle.png
  gameplay-attack.png
  gameplay-defeat.png
  skill.png             # if applicable
  notes.md              # only unresolved visual caveats
```

Short captured video may be used when timing cannot be judged from still images, but do not create large permanent QA archives unnecessarily.

## 10. Integration / commit discipline

Because the repository currently contains unrelated uncommitted work:

- do not reset or clean existing changes
- do not mass-format unrelated files
- worker jobs do not commit
- coordinator reviews `git diff` by owned paths
- coordinator runs model generation, gallery build, main build, and representative headless visual checks
- coordinator commits only files belonging to this initiative when the surrounding repository state permits a safe scoped commit

## 11. Gallery data shown per slime

Each card/detail page should expose useful production information, not only the model:

- form name
- branch / tier / mutation / fusion-form classification
- combat role
- signature behavior
- model status: planned / prototype / accepted
- motion status per clip
- current asset filename
- buttons for each motion

This makes the gallery both a player-facing art showcase and a development acceptance surface.

## 12. Completion definition

The initiative is complete when:

- every 30-form Codex entry has an individual design brief
- Greatsword and any later non-Codex fusion forms have separate design briefs
- gallery source can accept a new slime without shared-registry edits
- all accepted forms are viewable at `/slime-mercenaries/gallery/`
- only build output is present in the public repository
- all 30 discoverable forms plus approved fusion forms satisfy their per-slime acceptance gate
