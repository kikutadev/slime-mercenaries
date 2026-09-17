# Parallel Enemy Families Production Plan — Leaf / Flower / Forest Critter

Status: Completed
Date: 2026-09-18
Baseline: `origin/main` at planning time = `95a3c85`
Reference: `docs/content/enemy-next-families-reference-v1.md`

## 1. Goal

Mushroom V2で確立したproduction qualityを基準に、次の3 enemy familyを並列制作する。

- Leaf family — 葉っぱ系
- Flower family — 花系
- Forest Critter family — 小動物系

単にモデルを6体追加する計画ではない。

> **各familyが、独自body grammar・独自motion grammar・実戦で読める攻撃・かわいいHit/Defeat・gallery acceptanceまで持つproduction-ready enemy familyになること。**

First production batchは2体×3family = 6体とする。

| Family | Enemy | Role | Primary silhouette hook |
|---|---|---|---|
| Leaf | ちびリーフ / `leafling` | light melee | single broad leaf |
| Leaf | くるりリーフ / `whirl-leaf` | fast harasser | two-leaf pinwheel |
| Flower | つぼみん / `bud-bloom` | melee / poke | closed vertical bud |
| Flower | ぽふぽふ花 / `puff-flower` | ranged | round puff head |
| Critter | まるハリ / `round-hedgehog` | sturdy roller | bean + soft-quill shell |
| Critter | どんぐりリス / `acorn-squirrel` | fast ranged | pear body + huge tail |

3体目以降を先に量産しない。各familyの2体がproduction acceptanceを通ってから拡張する。

---

## 2. Current code review — parallelization blockers

最新mainの敵基盤はMushroom productionには十分だが、3family同時制作にはまだshared filesがMushroom前提である。

### 2.1 `tools/blender/enemies/build.py` is Mushroom-only

現在:

- `MushroomDefinition`を直接import
- `isinstance(definition, MushroomDefinition)`で型を固定
- `build_mushroom()`しか呼べない

このまま3レーンが始まると全レーンが`build.py`を変更し、即衝突する。

### 2.2 `tools/blender/enemies/validate.py` is Mushroom-only

現在のrequired nodeには`Stem` / `Cap`が含まれ、silhouette rulesも4 Mushroom GLB名を直接知っている。

Leaf / Flower / Critterには別node contractが必要で、共通validatorとfamily-specific profileへ分ける必要がある。

### 2.3 `src/game/enemy-motion.ts` is a single-family implementation

Mushroomのidle / move / attack / hit / defeat / spore VFXが1ファイルに集約されている。

今後6 behaviorを追加すると、巨大な`if behaviorId === ...`へ戻る危険がある。

### 2.4 `EnemyGalleryStage` is effectively Mushroom-specific

Galleryはproduction sourceを使えているが、secondary part animationがMushroomのBodyRoot / FaceRoot / spore前提である。

Leaf tip、petal、tail、earを動かすにはfamily rig adapterが必要。

### 2.5 `BattleRuntime` should not own family-specific geometry logic

V2でGLB runtimeへ移行済み。次family追加時も以下を`BattleRuntime.ts`へ増やさない。

- leaf mesh creation
- petal transformsの直書き
- squirrel tail animationの直書き
- family-specific projectile geometry

Runtimeはphase / target / damage / unit lifecycleを中心に保つ。

---

## 3. Production strategy

並列実装は4レーンで進める。

```text
Coordinator / shared foundation
  ├─ Lane A: Leaf family
  ├─ Lane B: Flower family
  └─ Lane C: Forest Critter family
```

重要:

> **3レーン開始前にCoordinatorがshared contractをfreezeする。**

各レーンは`build.py`、`validate.py`、`package.json`、`enemies.ts`、`encounters.ts`、`BattleRuntime.ts`を直接編集しない。

---

## 4. Phase 0 — Coordinator shared-family foundation

並列開始前に完了させる。

### 4.1 Generalize Blender family dispatch

Target:

```text
tools/blender/enemies/
├─ build.py                  # generic dispatcher only
├─ registry.py               # slug -> family builder contract
├─ validate.py               # common validator runner
├─ validation_profiles.py    # family / slug rules
├─ common/
├─ families/
│  ├─ mushroom.py
│  ├─ leaf.py                # lane-owned after freeze
│  ├─ flower.py              # lane-owned after freeze
│  └─ critter.py             # lane-owned after freeze
└─ definitions/
```

`build.py` must no longer import `MushroomDefinition` directly.

Example contract:

```py
@dataclass(frozen=True)
class EnemyBuildSpec:
    slug: str
    family: str
    build: Callable[[object], bpy.types.Object]
    definition_type: type
```

または同等のsimple registryでよい。深いframeworkにはしない。

### 4.2 Common runtime node contract

Every enemy GLB:

```text
EnemyRoot
├─ BodyRoot
├─ FaceRoot
│  ├─ Eye_L
│  └─ Eye_R
├─ AttackOrigin
├─ EffectOrigin
└─ GroundOrigin
```

Family optional semantic nodes:

Leaf:

```text
LeafRoot
LeafTip
LeafSecondary?   # whirl only
```

Flower:

```text
StemRoot
HeadRoot
PetalRoot
PuffRoot?        # puff only
```

Critter:

```text
HeadRoot
TailRoot?        # squirrel
Ear_L
Ear_R
ShellRoot?       # hedgehog
```

Runtimeはmesh名ではなくsemantic node名を見る。

### 4.3 Generalize validation

Common checks:

- required common nodes
- finite/non-degenerate bounds
- authored front direction
- materials present
- eyes <= total height 12%
- normal enemy source bounds within upper limit
- AttackOrigin / EffectOrigin finite

Family-specific checks:

- Leafling: single-leaf compact ratio
- Whirl Leaf: horizontal/pinwheel ratio
- Bud Bloom: vertical bud ratio
- Puff Flower: round/wide head ratio
- Hedgehog: low/wide body
- Squirrel: tail exists and contributes meaningful bounds

Validator must reject giant-eye regression for every family.

### 4.4 Split enemy motion source while preserving public import

Keep `src/game/enemy-motion.ts` as façade so existing imports do not break.

Target:

```text
src/game/enemy-motion/
├─ shared.ts
├─ mushroom.ts
├─ leaf.ts
├─ flower.ts
├─ critter.ts
└─ vfx.ts
```

`src/game/enemy-motion.ts` re-exports/dispatches.

### 4.5 Introduce family motion profile

Target semantic interface:

```ts
interface EnemyMotionProfile {
  idle(now: number, phase: number): EnemyPose;
  move(now: number, phase: number): EnemyPose;
  attack(u: number): EnemyPose;
  hit(u: number, side: number): EnemyHitPose;
  defeat(u: number, side: number): EnemyDefeatPose;
  attackDuration: number;
  contactU: number;
  projectileKind?: EnemyProjectileKind;
}
```

`EnemyPose`にはroot/bodyだけでなく、family secondary motionを表現できるbounded semantic channelsを持たせる。

例:

```ts
secondary: {
  primaryBend?: number;
  secondaryBend?: number;
  open?: number;
  twist?: number;
  wag?: number;
  earDrop?: number;
}
```

無制限なstring animation DSLにはしない。

### 4.6 Generic family pose adapter

Game / Gallery both use the same:

```text
getEnemyMotionProfile(behaviorId)
applyEnemySecondaryPose(familyId, rigParts, secondaryPose)
```

`BattleRuntime`と`EnemyGalleryStage`が別実装を持つことは禁止。

### Phase 0 acceptance

- Mushroom V2 game/gallery visual regressionなし
- existing Mushroom tests pass
- build/validator supports Mushroom through generic dispatcher
- three new family stubs can be registered without editing `build.py`
- no new family-specific code in `BattleRuntime.ts`

ここまで完了したcommitを3レーンの共通baseとする。

---

## 5. Lane A — Leaf family

### Ownership

Allowed:

```text
tools/blender/enemies/families/leaf.py
 tools/blender/enemies/definitions/leafling.py
 tools/blender/enemies/definitions/whirl_leaf.py
public/assets/enemies/leafling.glb
public/assets/enemies/whirl-leaf.glb
src/game/enemy-motion/leaf.ts
src/game/enemy-motion/leaf.test.ts
src/gallery/enemies/leafling.ts
src/gallery/enemies/whirl-leaf.ts
.tmp/enemy-parallel/leaf/**
```

Forbidden:

- `package.json`
- `tools/blender/enemies/build.py`
- `tools/blender/enemies/validate.py`
- `src/game/enemies.ts`
- `src/game/encounters.ts`
- `src/game/BattleRuntime.ts`
- shared gallery core
- other family files

### Leafling production motion

Idle:

- root sway: slow 2–3Hz以下
- LeafTip delayed bend
- tiny core breathing

Move:

- one soft skip
- leaf bends backward during forward release
- landingでleaf tipが遅れて追従

Attack:

```text
0–25%  leaf folds backward / anticipation
25–52% fast body hop + leaf slap forward
52–60% contact
60–100% leaf overshoots then settles
```

Hit:

- leaf folds sideways
- no full-body teleport

Defeat:

- leaf loses tension
- one sideways flutter
- body settles like a fallen soft leaf
- tiny × eyes remain readable

### Whirl Leaf production motion

Idle:

- two leaves rotate only a few degrees back/forth
- continuous propeller spinning禁止

Move:

- short wind-assisted glide + skip

Attack:

- anticipation: two leaves close slightly
- release: 0.15–0.25s fast half-spin
- gust/contact VFX
- recovery: leaf inertia settles after body

Signature VFX:

- small crescent gust, not giant tornado

### Leaf lane acceptance

- 128px grayscaleで2体が区別できる
- leaves never look like rigid blades
- no foot-walk cycle
- attack release is faster than anticipation
- game/gallery same motion source

---

## 6. Lane B — Flower family

### Ownership

Allowed:

```text
tools/blender/enemies/families/flower.py
tools/blender/enemies/definitions/bud_bloom.py
tools/blender/enemies/definitions/puff_flower.py
public/assets/enemies/bud-bloom.glb
public/assets/enemies/puff-flower.glb
src/game/enemy-motion/flower.ts
src/game/enemy-motion/flower.test.ts
src/gallery/enemies/bud-bloom.ts
src/gallery/enemies/puff-flower.ts
.tmp/enemy-parallel/flower/**
```

Same forbidden shared paths as Lane A.

### Bud Bloom production motion

Idle:

- bud opens only 3–6% visually
- head gently nods
- two lower leaves lag behind

Move:

- springy root bounce
- bud stays mostly closed

Attack:

```text
0–32%  stem/body compresses, bud closes tighter
32–58% fast spring release / poke
58–66% contact
66–100% petals rebound open slightly then settle
```

Hit:

- bud tips backward
- one lower leaf flick

Defeat:

- stem softens
- bud droops sideways
- petals loosen but do not explode off
- small × eyes

### Puff Flower production motion

Idle:

- puff head gently expands/contracts
- no noisy individual seed animation

Move:

- tiny body hops while puff head lags

Attack:

```text
0–40% puff inflates
40–50% hold / readable tell
50%     pollen puff release
50–100% recoil + soft settle
```

Projectile/VFX:

- 1 soft pollen orb / 3–5 tiny motes max
- projectile stays below friendly signature VFX intensity

Hit:

- puff compresses locally / root wobble

Defeat:

- puff deflates slightly
- harmless small motes drift up
- no full seed explosion

### Flower lane acceptance

- closed bud vs round puff is unmistakable without color
- petals remain large and low-count
- attack tells are shape changes, not only VFX
- no realistic thin stem

---

## 7. Lane C — Forest Critter family

### Ownership

Allowed:

```text
tools/blender/enemies/families/critter.py
tools/blender/enemies/definitions/round_hedgehog.py
tools/blender/enemies/definitions/acorn_squirrel.py
public/assets/enemies/round-hedgehog.glb
public/assets/enemies/acorn-squirrel.glb
src/game/enemy-motion/critter.ts
src/game/enemy-motion/critter.test.ts
src/gallery/enemies/round-hedgehog.ts
src/gallery/enemies/acorn-squirrel.ts
.tmp/enemy-parallel/critter/**
```

Same forbidden shared paths.

### Rig policy

最初からSkinnedMesh / realistic quadruped rigへ行かない。

Transform nodes:

- BodyRoot
- HeadRoot
- Ear_L / Ear_R
- optional TailRoot
- optional ShellRoot

でproduction feelを作る。

### Round Hedgehog production motion

Idle:

- tiny nose sniff
- shell subtle breathing
- ears almost still

Move:

- 2-step scamper illusionをroot/body squashで表現
- 足を細かくcycleさせない

Attack:

```text
0–30% body crouches, shell rounds up
30–42% tiny hop into curl
42–67% short roll/lunge
67%     contact
67–100% uncurl + wobble settle
```

Hit:

- shell compress + tiny recoil

Defeat:

- one soft half-roll
- flop to side
- quills remain plush/rounded
- face visible enough for tiny × eyes

### Acorn Squirrel production motion

Idle:

- tail slow follow-through
- ears tiny twitch, low frequency

Move:

- quick hop/scamper
- tail counterbalances body

Attack:

- crouch
- tail sweeps backward
- acorn toss
- small recoil

Projectile:

- one rounded acorn
- shallow arc
- no realistic high-speed weapon feel

Hit:

- ears fold briefly
- tail overshoots

Defeat:

- tail falls over body like blanket
- body sits/flops
- small × eyes, no realistic injury

### Critter lane acceptance

- cute toy animal, not realistic wildlife
- Hedgehog shell vs Squirrel tail reads immediately
- tail/ears provide secondary motion but never jitter
- no four-leg locomotion complexity
- normal eyes remain bead-scale

---

## 8. Coordinator integration after lanes finish

Only Coordinator edits shared runtime/content.

### 8.1 Register content

Update:

- `src/game/enemies.ts`
- behavior/family type unions
- build registry
- validator profiles
- npm generation/validation scripts

### 8.2 Encounter placement

Do not replace stage balance/rewards.

Visual encounter progression target:

```text
Stage 1
  Mushroom onboarding remains simple

Stage 2
  introduce Leaf family
  mushroom + leaf mixes

Stage 3
  introduce Flower family
  leaf / flower / mushroom mixes

Stage 4
  introduce Forest Critter family
  plant + critter mixes

Stage 5
  mixed-road gauntlet
  Great Mushroom remains current first boss
```

Exact counts are visual/content tuning, not a new economy rebalance.

### 8.3 Behavior integration

Target behavior IDs:

```text
leaf-hop-slap
leaf-whirl
flower-bud-poke
flower-pollen
critter-roll
critter-acorn
```

Avoid species checks inside target-selection logic unless behavior truly requires different targeting.

### 8.4 Projectile/VFX registry

Coordinator provides bounded projectile kinds:

- spore
- gust
- pollen
- acorn

Each lane owns production visual factory in its motion/VFX module; runtime owns lifecycle/pooling.

---

## 9. Animation completeness gate

A model is not complete when its GLB looks good.

Every one of the 6 enemies must have all rows accepted:

| Enemy | Idle | Move | Attack | Hit | Defeat | Signature VFX |
|---|---:|---:|---:|---:|---:|---:|
| Leafling | required | required | required | required | required | n/a |
| Whirl Leaf | required | required | required | required | required | gust |
| Bud Bloom | required | required | required | required | required | n/a |
| Puff Flower | required | required | required | required | required | pollen |
| Round Hedgehog | required | required | required | required | required | n/a |
| Acorn Squirrel | required | required | required | required | required | acorn |

No `MODEL`-only final state for these six. Gallery status must be production/live after acceptance.

---

## 10. Gallery acceptance workflow

Each lane must use exact production GLB + exact production motion functions.

Required gallery controls:

- 3/4 inspection
- battle camera
- front
- Idle
- Move
- Attack
- Hit
- Defeat
- 0.5x / 1x / 2x

Family secondary parts must animate in gallery exactly as battle runtime.

No lane may create a separate gallery-only fake motion.

---

## 11. Visual QA artifacts

Each lane creates ignored QA captures:

```text
.tmp/enemy-parallel/<family>/
├─ reference-notes.md
├─ family-board.png
├─ <enemy>-front.png
├─ <enemy>-battle-idle.png
├─ <enemy>-move-strip.png
├─ <enemy>-attack-strip.png
├─ <enemy>-hit.png
└─ <enemy>-defeat.png
```

Ranged enemy adds:

```text
<enemy>-projectile-release.png
<enemy>-projectile-flight.png
<enemy>-projectile-impact.png
```

### Required frame-strip review

Attack is reviewed as contact sheet, not a single screenshot.

Minimum samples:

```text
anticipation
release start
pre-contact
contact
recoil
recovery
```

This prevents "good still pose, bad animation" acceptance.

---

## 12. Automated tests

### 12.1 Family motion tests

For every motion module:

- outputs finite for u=0..1
- scale values > 0
- contact/release threshold in 0..1
- attack duration > 0
- defeat ends in stable terminal state
- secondary channel ranges bounded

### 12.2 Content tests

- every EnemyId resolves
- every behavior profile resolves
- every asset path exists
- every gallery model references same asset
- every encounter ID resolves
- max normal enemy cap remains <= 12

### 12.3 GLB validation

- common semantic nodes
- family semantic nodes
- eye hard cap 12%
- authored front direction
- family silhouette rule
- material existence
- projectile origin where applicable

### 12.4 Runtime regression

- Mushroom V2 remains unchanged
- existing Tier2/Tier3 friendly production motion remains unchanged
- adding enemy family does not recreate friendly scene for unrelated state changes

---

## 13. Mobile battle acceptance

Use portrait baseline 430×932 and at least one narrower device width.

Required scenes:

1. 3 enemies — one family only
2. 6 enemies — two-family mix
3. 10–12 enemies — three-family mix
4. 6 friendly slimes + 8 mixed enemies
5. Great Mushroom boss + 2–4 new-family adds in QA-only scene

Acceptance:

- family readable before color
- friendly slime remains focal point
- ranged projectile source identifiable
- secondary motion does not cause visual noise
- defeat remains readable at contact point
- no giant eyes after animation state change
- no body intersection severe enough to hide role silhouettes

---

## 14. Performance budget

Normal enemy target remains mobile web.

Rules:

- one GLB parse per asset, clone instances
- no per-instance texture downloads
- no full skeletal rig unless transform rig fails acceptance
- projectile/VFX pooling before high enemy counts
- petal/leaf/quill count bounded
- avoid transparent layered fur/foliage shaders

Target relative complexity:

```text
Leaf normal <= Mushroom normal
Flower normal <= 1.25 × Mushroom normal
Critter normal <= 1.5 × Mushroom normal
```

Boss budget remains separate.

---

## 15. Parallel execution order

### Gate A — Coordinator, sequential

1. generic build registry
2. generic validator profiles
3. enemy motion façade split
4. generic family rig adapter
5. gallery/runtime Mushroom regression test
6. commit shared base

Do not launch lanes before Gate A passes.

### Gate B — Three lanes in parallel

Run simultaneously:

- Lane A Leaf
- Lane B Flower
- Lane C Critter

Each lane completes model + motion + gallery + QA, not model only.

### Gate C — Coordinator merge

1. merge all three lanes
2. resolve only coordinator-owned registry/type changes
3. register EnemyDefinitions
4. integrate encounters
5. mixed-family battle QA
6. performance QA
7. full test/typecheck/build/GLB validation
8. deploy gallery
9. deploy game
10. verify public URLs and console

---

## 16. Lane handoff contract

Each parallel lane reports exactly:

```text
models generated:
motions completed:
VFX completed:
GLB validation:
gallery QA:
battle-camera QA:
tests:
owned paths changed:
known issues:
```

"モデル完成"だけの報告は禁止。

---

## 17. Definition of done

This initiative is complete only when:

1. 6 new enemies have checked-in Blender Python source.
2. All six have production GLBs.
3. All six have Idle / Move / Attack / Hit / Defeat.
4. Whirl Leaf / Puff Flower / Acorn Squirrel have production signature projectile/VFX.
5. Game and gallery use identical assets and motion sources.
6. 6 enemies are distinguishable in 128px grayscale board.
7. Eye size validator prevents V1-style regression.
8. Leaf / Flower / Critter use separate body grammars from Mushroom.
9. Existing Mushroom V2 remains visually unchanged.
10. Existing friendly slime production motions remain unchanged.
11. Mixed-family encounters work on portrait mobile.
12. Full typecheck/test/build/GLB validation passes.
13. Gallery deployment is verified.
14. Public game battle is verified with at least one encounter from each new family.

---

## 18. Recommended next action

Do not start three model lanes immediately.

First implement **Gate A shared-family foundation** in one coordinator branch/worktree and freeze it. Once that commit is accepted, create three independent worktrees from the exact same commit and dispatch Leaf / Flower / Critter simultaneously.

This is the shortest path to genuine parallelism without repeating the Mushroom V1 problem or creating merge-heavy shared-file work.

## 19. Completion record — 2026-09-18

Implemented and production-verified.

Parallel lane commits:

- Leaf: `b213173` (`813d0a1` after coordinator cherry-pick)
- Flower: `0d8e419` (`28c0962` after coordinator cherry-pick)
- Forest Critter: `07cea52` (`3ac5894` after coordinator cherry-pick)
- Shared multi-family foundation: `6d24006`
- Coordinator integration: `f855c30`

Delivered production enemies:

- `leafling` / ちびリーフ
- `whirl-leaf` / くるりリーフ
- `bud-bloom` / つぼみん
- `puff-flower` / ぽふぽふ花
- `round-hedgehog` / まるハリ
- `acorn-squirrel` / どんぐりリス

Acceptance results:

- typecheck: PASS
- tests: 84 / 84 PASS
- GLB validation: 10 / 10 enemies PASS
- production build: PASS
- 6 new enemies distinguishable in grayscale family boards
- production gallery verified for Idle / Move / Attack / Hit / Defeat
- gust / pollen / acorn projectile paths verified in gallery and battle runtime
- 12 enemies + 6 friendly slimes crowd test completed at portrait-mobile viewport
- existing friendly production motion methods mechanically verified unchanged from pre-integration `origin/main`
- canonical production deployment verified at `https://games.kikuta.dev/slime-mercenaries/`
- all six production GLBs return HTTP 200 from the canonical deployment

GitHub Pages remains redirect-only and was not converted back into a game-hosting deployment target.


## 20. Chat-parallel production polish round — 2026-09-18

The six new enemies were then independently polished in three **separate ChatGPT project chats** sharing one clean worktree (`.slime-enemy-parallel`). File ownership remained family-exclusive; child chats were forbidden from shared runtime, registry, deploy, and git history operations.

Polish acceptance:

- Leaf: single broad soft leaf vs compact two-leaf pinwheel, sharper slap/whirl timing, gust release/flight verified.
- Flower: closed vertical bud vs round pom-pom crown, shape-based attack tells, pollen release/flight/pre-impact verified.
- Critter: low plush hedgehog shell vs oversized squirrel tail, roll/acorn timing refined, tail/ear secondary motion bounded.
- 128px grayscale family boards reviewed for all three families.
- Attack reviewed as six-frame contact sheets rather than still poses.
- Hit/Defeat and portrait battle-camera contact reviewed for every family.
- Latest coordinator gate: 84/84 tests PASS, typecheck PASS, 10/10 enemy GLB validation PASS, production build PASS.

The shared worktree is the integration source; per-family child chats do not commit or deploy independently.

