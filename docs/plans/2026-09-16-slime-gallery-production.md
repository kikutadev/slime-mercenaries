# Slime Model & Motion Gallery — Modular Production Plan

Status: In Progress
Date: 2026-09-17

## 1. Goal

Produce the 30 discoverable slime forms plus non-Codex fusion presentation forms such as Greatsword Slime without sculpting 31 unrelated characters.

The production model is:

```text
1 shared Base Slime
+ reusable socketed part library
+ per-form composition definitions
+ shared production motion profiles
= exported per-form GLBs
```

The public repository receives build output only. Blender Python source, composition definitions, gallery source, design documents, and QA remain in the development repository.

Target public layout:

```text
/slime-mercenaries/
  index.html
  assets/*.glb
  gallery/
    index.html
```

The gallery is a production acceptance surface. It must use the same GLBs, motion functions, timing, equipment axes, projectile timing, and combat VFX definitions as the game. Gallery-only approximations of production motion are prohibited.

## 2. Source of truth

Per-form design briefs remain in:

```text
docs/content/slimes/
```

Each brief owns content intent: silhouette, equipment, materials, combat behavior, motion character, VFX language, and acceptance notes.

The actual model topology and reusable geometry are owned by the modular Blender source described below. A form brief does not imply a unique body mesh.

Product-level contracts remain authoritative:

- `docs/specs/art-direction.md`
- `docs/specs/combat.md`
- `docs/specs/evolution-roster.md`

## 3. Production architecture

### 3.1 Base Slime is shared

Ordinary jobs do not get independently authored body meshes.

The shared base owns:

```text
SlimeRoot
├─ Body
│  └─ reusable morph targets
│     ├─ Squash
│     ├─ Stretch
│     ├─ LeanLeft / LeanRight
│     ├─ WobbleLeft / WobbleRight
│     └─ HitLeft / HitRight
├─ FaceRoot
│  ├─ Eye_L
│  ├─ Eye_R
│  └─ Mouth
├─ HeadSocket
├─ FrontLeftSocket
├─ FrontRightSocket
├─ BackSocket
├─ WeaponSocket
├─ OffhandSocket
└─ Effect sockets
   ├─ ProjectileOrigin
   ├─ WeaponTip where applicable
   └─ SpellOrigin where applicable
```

The ordinary-job body silhouette should remain roughly 80–90% common. Job identity comes primarily from equipment, accessories, material accents, VFX, and motion.

### 3.2 Reusable part library

Parts are authored once and reused across forms.

Target structure:

```text
tools/blender/slimes/
├─ build.py
├─ base/
│  ├─ body.py
│  ├─ character.py
│  ├─ context.py
│  ├─ materials.py
│  └─ primitives.py
├─ parts/
│  ├─ melee.py
│  ├─ ranged.py
│  ├─ defense.py
│  ├─ magic.py
│  ├─ rogue.py
│  ├─ gun.py
│  └─ mutation.py
└─ definitions/
   ├─ plain.py
   ├─ sword.py
   ├─ greatsword.py
   ├─ shield.py
   ├─ bow.py
   ├─ wand.py
   ├─ dagger.py
   ├─ gun.py
   └─ ... one composition definition per form
```

A definition describes composition and build parameters; it must not duplicate the base body generator.

Example intent:

```python
DEFINITION = SlimeDefinition(
    slug="sword",
    body_preset="standard",
    body_color=(...),
    motion_profile="sword",
)


def build_parts(ctx):
    create_basic_sword(ctx, socket="WeaponSocket")
```

Definitions are loaded by filename/module name so workers do not edit one central registry for every new form.

### 3.3 Build-time assembly, not runtime kit-bashing

Parts are shared in source, but each accepted form is exported to a standalone GLB.

```text
Base + parts + definition -> sword-slime.glb
Base + parts + definition -> shield-slime.glb
Base + parts + definition -> mage-slime.glb
```

The game runtime stays simple and loads one accepted GLB per form. We do not require dynamic mesh assembly in the browser.

### 3.4 Body variation is parameterized, not duplicated

Allowed definition-level variation includes restrained values such as:

- base material/color
- roughness / coat / translucency-compatible material settings
- body X/Y/Z scale within art-direction limits
- eye spacing / eye scale / eye height
- minor face offset
- optional mutation-specific attachments

Ordinary level and fusion progression must not permanently enlarge the body.

Rare mutations may deviate more strongly, but should still reuse the base jelly whenever practical.

## 4. Current foundation status

Already complete:

1. Separate `/gallery/` build entry and GitHub Pages publication.
2. Gallery auto-discovers per-form TypeScript definitions.
3. Sword / Greatsword / Bow use the same production GLBs in game and gallery.
4. Production and gallery motion logic is shared through `src/game/slime-motion.ts`.
5. Sword / Greatsword / Bow model facing and front-side equipment anchors were corrected.
6. Production and gallery builds are deployed together from the same revision.

Completed in the current modular-production batch:

1. `tools/blender/generate_slime.py` is now a compatibility wrapper over `tools/blender/slimes/`.
2. Shared Base Slime topology, morph targets, face, stable sockets, materials, primitives, and GLB export live under `base/`.
3. Sword / Greatsword / Bow were ported to modular parts without changing their imported world transforms / mesh vertices.
4. Plain exports the canonical no-equipment Base Slime.
5. Shield / Wand / Dagger / Gun Tier-1 part families were produced in parallel through separate ordinary ChatGPT sessions with disjoint file ownership.
6. Their exported production assets were round-trip checked after GLB import; the parallel builder reproduces the same node hierarchy, world transforms, mesh vertices, and morph-name contract.
7. Plain / Shield / Wand / Dagger / Gun are exposed in the gallery as `MODEL REVIEW`; no fake attacks are exposed before production runtime integration.

Next shared-production work:

1. Integrate production combat behavior for Plain / Shield / Wand / Dagger / Gun one family at a time.
2. Promote a model from `MODEL` to `LIVE` only after game and gallery share the exact runtime motion implementation.
3. Resolve the cross-cutting socket/deformation question before authoring stronger head-accessory motions: large Body morphs currently do not move attachment sockets.
4. Start Tier-2 part production in parallel only after each branch's Tier-1 socket/orientation contract is accepted.

## 5. Parallel work model

No worktree is required for normal asset production once the shared interfaces are frozen, because each lane owns disjoint files.

Workers do not edit shared base interfaces after parallel production begins. Cross-cutting changes are returned to the coordinator and applied once.

### Lane A — Base / assembler / Plain

Owns:

- `base/*`
- `build.py`
- Plain definition
- socket contract
- export contract
- backward compatibility for accepted node names

This lane is the only lane allowed to change shared body topology or socket semantics.

### Lane B — Melee parts

Owns:

- Sword
- Greatsword
- Fighter / Blademaster / Berserker weapon/accessory modules
- Dagger-family blade primitives where shared geometry is appropriate

Does not duplicate the body generator.

### Lane C — Defense parts

Owns:

- Shield
- Guardian
- Paladin
- Fortress
- shields / helmets / defensive accents

### Lane D — Bow / physical ranged parts

Owns:

- Bow
- Ranger
- Sniper
- Storm Archer
- bows / quivers / ranged physical accessories

### Lane E — Magic parts

Owns:

- Wand
- Mage
- Archmage
- Frost Mage
- wands / caps / magical ornaments / spell sockets

### Lane F — Gun / engineering parts

Owns:

- Gun
- Gunner
- Cannoneer
- Engineer
- firearm / cannon / engineering accessories

### Lane G — Mutation parts

Owns:

- King
- Golden
- Dragon
- Prism
- Mimic
- crown / cape / horns / wings / chest shell / mutation material overrides

Dagger / Rogue / Ninja / Assassin may be kept as a dedicated sub-lane when implementation begins if melee-file ownership would otherwise collide; the coordinator assigns separate files before starting that batch.

## 6. First parallel implementation batch

The first batch proves the modular system with reusable Tier-1 vocabulary.

Serial bootstrap:

1. Freeze Base Slime topology and node names.
2. Add socket contract.
3. Add modular builder and auto-loaded form definitions.
4. Port accepted Sword / Greatsword / Bow into modules without visual regression.

Then run in parallel:

- Plain — no permanent equipment; proves canonical base export.
- Shield — body-sized round shield; proves offhand/defense silhouette.
- Wand — crooked wand + tiny cap; proves weapon + head accessory + spell origin.
- Dagger — hood + readable dagger; proves small asymmetric melee equipment.
- Gun — oversized flintlock; proves long barrel orientation and projectile origin.

Sword / Greatsword / Bow are regression references during this batch, not newly designed bodies.

## 7. Model publication waves

Implementation can happen in parallel. Public acceptance remains ordered so a later form may finish early but stay unpublished.

### Wave 0 — base pipeline

1. Plain Slime
2. Sword Slime
3. Greatsword fusion form
4. Bow Slime

### Wave 1 — Tier 1 vocabulary

5. Shield Slime
6. Wand Slime
7. Dagger Slime
8. Gun Slime

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

## 8. Motion implementation rule

Model production and combat behavior are separate concerns, but the gallery never invents a substitute production motion.

For each form:

1. Build modular GLB.
2. Add/extend production behavior and shared motion implementation in game code.
3. Gallery exposes that same production motion implementation.
4. QA in Inspection / Battle / Front views.
5. Publish only after game + gallery acceptance.

If a form does not yet have production combat behavior, the gallery may show the model in Idle only and mark the remaining motion status as planned; it must not simulate a fake attack for presentation purposes.

## 9. Per-form model acceptance gate

Before production combat work begins:

1. Body is sourced from the canonical Base Slime unless the mutation exception is documented.
2. No copied/private body generator exists in the definition.
3. Equipment uses the socket contract and is on the physical front/side intended by gameplay.
4. Face remains visible in the Battle camera.
5. Silhouette is identifiable at portrait gameplay scale.
6. Equipment does not look humanoid or require invisible hands/limbs.
7. Projectile / WeaponTip / SpellOrigin sockets originate from believable geometry.
8. No unacceptable clipping in Idle and basic squash/stretch poses.
9. Ordinary forms keep baseline body scale invariant.
10. GLB node names required by runtime are preserved.

## 10. Production acceptance gate

A form is publishable only when all applicable checks pass at real speed and gameplay scale:

1. Same accepted GLB is loaded by game and gallery.
2. Same shared motion functions drive game and gallery.
3. Idle remains soft and alive.
4. Move remains slime-like rather than humanoid walking.
5. Attack source, target, and hit geometry are obvious.
6. Weapon orientation is physically believable at the damaging frame.
7. Anticipation is readable without slowing combat excessively.
8. Release/impact is crisp and uses production hit-stop/VFX.
9. Skill geometry matches actual gameplay behavior.
10. Defeat ends in readable flatten + × eyes.
11. Battle / Inspection / Front cameras expose no serious orientation defects.
12. Mobile framing includes body plus oversized equipment.
13. No runtime console errors.
14. Typecheck, tests, and production build pass.

## 11. QA evidence

Preserve lightweight internal evidence only:

```text
.acceptance/slimes/<slug>/
  inspection-idle.png
  battle-idle.png
  battle-attack.png
  defeat.png
  notes.md            # only when unresolved caveats exist
```

Do not place QA captures in the public build.

## 12. Integration discipline

The repository contains unrelated parallel work. Therefore:

- do not reset or clean unrelated changes
- do not mass-format unrelated files
- parallel lanes own disjoint files
- generated GLBs have unique filenames
- final build/deploy is coordinator-only
- coordinator stages only initiative-owned paths
- clean build is performed from a committed revision before publishing

## 13. Completion definition

The initiative is complete when:

- one canonical Base Slime source owns ordinary-body topology and morphs
- reusable socketed part modules cover all produced forms
- all 30 Codex forms and approved fusion forms are composition definitions, not duplicated full-body generators
- game and gallery load the same accepted GLBs
- game and gallery use the same production motion/VFX functions
- all accepted forms are viewable under `/slime-mercenaries/gallery/`
- only built output is deployed publicly
- all forms satisfy model and production acceptance gates

## Animation production quality gate — spectacle first

Model completion alone is not a release condition. The primary target is not animation complexity, beat count, or VFX quantity. The target is **immediate spectacle and coolness**: when the job name is hidden, the player should still think “this one looks powerful, distinctive, and fun to use.”

### Primary acceptance question

For every combat form, especially Tier 2 and Tier 3, ask first:

> Does the attack look genuinely cool and satisfying at real game speed on a phone-sized battle view?

If the answer is not an immediate yes, the motion is not accepted even when it has many beats, particles, or secondary systems.

### What creates the desired feeling

Use these as tools, not quotas:

- **strong pose and silhouette** before the hit
- **sharp acceleration / release** instead of uniformly slow motion
- **weapon or spell path that reads instantly**
- **clean hit-stop, recoil, squash/stretch, camera impulse, and aftermath** where appropriate
- **bold trails, flashes, shockwaves, runes, lightning, ice, smoke, debris, afterimages, explosions, etc.** when they reinforce the job fantasy
- **clear contrast between anticipation and payoff**
- **a signature visual idea unique to the job**, not just recolored generic particles
- **production-scale readability**: effects may be flashy, but the slime, target, and attack direction must remain readable

### Tier intent

- **Tier 1:** already enjoyable and punchy. Establish the branch fantasy with one memorable attack. “Basic” does not mean dull.
- **Tier 2:** visibly more impressive and specialized than Tier 1. Add a stronger signature motion or payoff when it improves the fantasy, but do not add complexity merely to satisfy a checklist.
- **Tier 3:** should feel like a showcase character. The player should be able to watch the attack repeatedly in the gallery because it looks cool. A single devastating motion can be better than a long sequence. Use large, confident silhouettes and strong signature VFX/camera/hit reactions where appropriate.
- **Rare / mutation forms:** may exceed branch conventions entirely. Rarity should be obvious from motion and presentation before UI text is read.

### Explicit anti-goals

Reject a motion when any of the following is true:

- it is merely the lower-tier attack played faster
- it technically has multiple phases but none of them creates a strong payoff
- the VFX count increased but the attack still looks weak
- the character is visually busy but not stylish or readable
- the strongest form still looks like “a slime wiggling while an effect happens nearby”
- a screenshot looks acceptable but the real-time release has no snap, impact, or excitement

Quality review is performed at **1x real speed first**, then 0.5x for technical inspection, in both **Battle** and **3/4 Inspect** views at mobile width. Final acceptance is visual and experiential: job identity, impact, spectacle, and replay appeal matter more than beat count. Gallery-only substitute animation is prohibited; the gallery must execute the same shared production motion/VFX implementation as `BattleRuntime`.
