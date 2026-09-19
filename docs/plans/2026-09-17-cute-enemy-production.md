# Cute Enemy Character Production Plan

Status: Completed
Date: 2026-09-17

## 1. Goal

『スライム傭兵団』の敵を、現在の仮キノコから production quality の「かわいいが敵として読みやすい」キャラクター群へ置き換える。

狙いは単なる高密度モデル化ではない。

> **味方スライムを主役として保ちながら、敵にも見た瞬間に性格・攻撃・倒した時の反応が分かる愛嬌を持たせる。**

敵は味方スライムの色違いにはしない。同じ明るい toy-like world に属しつつ、種族ごとに異なる body grammar を持つ。

最初の production vertical slice は Clover Road の Mushroom family と Great Mushroom boss とする。

---

## 2. Code review — current state

### 2.1 Enemy visual is still a procedural placeholder

`src/game/BattleRuntime.ts` の `createEnemy()` が、Capsule + Sphere + eye meshes を直接生成している。

現在の敵表現は以下を一か所に抱えている。

- model construction
- materials
- scale
- HP
- movement
- attack timing
- hit reaction
- defeat animation
- spawn count / positions

味方側は GLB + presentation definition + shared motion へ分離が進んでいるため、敵だけ production asset pipeline から外れている。

### 2.2 Enemy type is effectively hard-coded to one kind

`EnemyUnit.kind` は `'Mushroom'` 固定で、`ENEMY_MAX_HP = 4`、`ENEMY_ATTACK_RANGE`、`ENEMY_MOVE_SPEED` も global constant である。

そのため現在の runtime へ敵種を追加すると、`if kind === ...` と定数が `BattleRuntime.ts` に増殖する構造になっている。

### 2.3 Stage progression and rendered enemy composition are disconnected

`StageWaveDefinition` は `work / rewards / randomDrops` を持つが、enemy encounter identity を持たない。

`BattleSceneModel` は `stageNumber / waveIndex` を保持しているにもかかわらず、runtime へ enemy definition を渡していない。結果として、どの stage / wave でも runtime は同じ3体のキノコを生成する。

Headless/offline simulation が enemy mesh を知る必要はないが、stage content は少なくとも安定した encounter ID を持つべきである。

### 2.4 Battle UI also assumes one enemy

`src/screens/BattleScreen.tsx` は敵名を `森のキノコ` と直接表示している。

`BattleSnapshot` も enemy aggregate HP / alive count のみで、現在 encounter の表示名・boss flag・elite presentation を持たない。

### 2.5 Enemy motion exists, but is not authored as reusable motion language

現状にも以下は存在する。

- hop movement
- lunge attack
- hit pulse
- squash defeat

しかし数値式が `BattleRuntime.ts` 内に直接埋まっており、モデル形状や敵familyごとの motion identity と分離されていない。

味方の `slime-motion.ts` と同様、enemy animation も pure pose function を正本にした方が game / gallery / QA で同じ motion を再利用できる。

### 2.6 Enemy asset / acceptance pipeline is absent

`public/assets/` には slime GLB はあるが enemy GLB がない。

Blender側も `tools/blender/slimes/` の modular system はある一方、enemy family 用 source-of-truth が存在しない。

したがって「敵を増やす」前に、再現可能な Blender Python generation と acceptance surface を作る必要がある。

### 2.7 `BattleRuntime.ts` is already too large for enemy content expansion

現在の file は environment、ally loading、ally motion、projectile、impact、enemy creation、enemy AI、battle result まで同居している。

敵を4種、8種と追加する際に runtime 本体へ geometry / motion timing / species-specific behavior を追加する方針は採用しない。

ただし全面 rewrite も不要。まず enemy definition / motion / asset loading を分離し、`BattleRuntime` は target selection・damage・phase orchestration を中心に残す。

---

## 3. Visual direction

既存 `docs/specs/art-direction.md` の原則を維持する。

敵の優先順位は以下。

1. **かわいさ** — 丸い、低重心、表情が大きい、反応が柔らかい
2. **読みやすさ** — silhouette だけで役割が分かる
3. **敵らしさ** — 味方スライムと同じ body / gloss identity にはしない
4. **主役を奪わない** — 通常敵は装飾を盛りすぎない
5. **倒したくなる気持ちよさ** — violence ではなく、ころぶ・潰れる・胞子がぽふっと出る等の comic reaction

### 3.1 Mushroom family grammar

共通特徴:

- cap が body 全体の約45–60%を占める oversized silhouette
- cream / pale stem body
- 大きな濃色の目
- tiny mouth は必要な state のみ
- cap は coral / peach / orange / red 系を中心にする
- 斑点は2–4個程度で、小画面でノイズにならない
- rigid humanoid limb は付けない
- 移動は歩行ではなく bounce / wobble

顔は front-facing fixed decal ではなく、3/4 battle camera で読める geometry / socket とする。

### 3.2 First production roster

#### A. ちびキノコ — basic fodder

役割: 最初に会う標準敵。

Silhouette:

- 横に少し広い柔らかな傘
- 細すぎない短い stem
- round eyes
- tiny neutral mouth

Motion:

- idle: 傘が呼吸するように上下
- move: 小さな2段 bounce
- attack: 一度縮む -> 勢いよく頭突き -> 反動でぷるん
- hit: 傘が片側へ wobble
- defeat: stem がへたり、傘が斜めに落ちて `ぐにゃ`、目が `×` / spiral のどちらか

#### B. ぷくキノコ — sturdy / elite-lite

役割: 見ただけで少し硬そうな敵。

Silhouette:

- basic より丸く厚い cap
- body は同じ family proportions の範囲
- one exaggerated feature = cap thickness

Motion:

- attack anticipation が少し長い
- contact 時に body 全体で押す
- hit では小さく揺れるだけ
- defeat で空気が抜けるように `ぷしゅっ` と潰れる

#### C. ほうしキノコ — ranged/support

役割: Mushroom Forest へ繋がる予告敵。Clover Road 後半から少数出す。

Silhouette:

- cap underside / side に小さな spore pouch
- 紫または teal の accent は一か所だけ

Motion:

- attack: cap が膨らむ -> `ぽふっ` と spore projectile
- recoil: 自分も少し後ろへ縮む
- defeat: 小さな harmless spore puff

#### D. オオキノコ — first boss

役割: 3–5分の最初の大きな payoff。

Silhouette:

- normal enemy の約2.0–2.5倍の visual height
- cap の縁を大きく wave させる
- face はnormal familyと同じgrammarを残し、怖くしすぎない
- crown/armorのような別テーマ装飾は付けない

Boss tells:

- heavy bounce: cap が大きく縮む -> 0.35–0.55s tell -> landing
- optional spore puff: cap が一度膨らむ -> radial puff

Defeat:

- 1回大きく wobble
- cap が顔へかぶさる
- body がへたり込む
- 小さなspore / dustが出て終わる

倒した後に gore / explosion は使わない。

---

## 4. Asset architecture

Slime と同様に Blender Python を source of truth とするが、敵全体を一つの共通bodyへ無理に押し込まない。

**enemy family ごとに shared base を持つ。**

```text
tools/blender/enemies/
├─ README.md
├─ build.py
├─ common/
│  ├─ context.py
│  ├─ export.py
│  ├─ materials.py
│  └─ primitives.py
├─ families/
│  └─ mushroom.py
└─ definitions/
   ├─ tiny_mushroom.py
   ├─ plump_mushroom.py
   ├─ spore_mushroom.py
   └─ great_mushroom.py
```

Mushroom family source owns:

- common stem/cap construction
- common face
- common deformation-friendly hierarchy
- stable sockets
- material presets

Per-enemy definition owns:

- body/cap proportions
- colors
- spots / one exaggerated feature
- boss scale class
- optional spore pouch

### 4.1 Runtime node contract

Initial stable nodes:

```text
EnemyRoot
├─ BodyRoot
│  ├─ Stem
│  └─ Cap
├─ FaceRoot
│  ├─ Eye_L
│  ├─ Eye_R
│  └─ Mouth
├─ EffectOrigin
├─ AttackOrigin
└─ GroundOrigin
```

Optional expression nodes / morph targets:

- Squash
- Stretch
- WobbleLeft / WobbleRight
- HitLeft / HitRight
- CapPuff

Model implementation may use transforms instead of morph targets when the same production motion can be achieved more robustly. Runtime contract should care about semantic nodes, not Blender-internal implementation details.

### 4.2 Do not couple enemy body to Base Slime

Enemy pipeline may share low-level generic helper ideas, but Mushroom body must not inherit Base Slime geometry.

The cute world is shared; species identity is not.

During the current parallel slime production work, do not refactor frozen `tools/blender/slimes/base/*` merely to deduplicate a few helper functions. Cross-family helper extraction can happen after both pipelines are stable.

---

## 5. Runtime content architecture

### 5.1 Enemy definitions

Add `src/game/enemies.ts`.

Target shape:

```ts
export type EnemyId =
  | 'tiny-mushroom'
  | 'plump-mushroom'
  | 'spore-mushroom'
  | 'great-mushroom';

export type EnemyBehaviorId =
  | 'mushroom-bump'
  | 'mushroom-heavy-bump'
  | 'mushroom-spore'
  | 'mushroom-boss';

export interface EnemyDefinition {
  id: EnemyId;
  name: string;
  asset: string;
  behaviorId: EnemyBehaviorId;
  maxHp: number;
  moveSpeed: number;
  attackRange: number;
  attackInterval: number;
  scaleClass: 'fodder' | 'elite' | 'boss';
  shadowRadius: number;
}
```

Exact numbersは balance tuning data とし、モデル生成コードへ埋め込まない。

### 5.2 Encounter definitions

Add `src/game/encounters.ts` or equivalent presentation/content module.

```text
encounter.clover-road.01.01
  tiny-mushroom x3

encounter.clover-road.03.02
  tiny-mushroom x2
  plump-mushroom x1

encounter.clover-road.05.boss
  great-mushroom x1
```

Spawn positions are formation slots / spawn policy から決め、各 encounter definition へ world coordinates を大量に直書きしない。

### 5.3 Stage -> encounter boundary

Extend current stage wave metadata with a stable `encounterId`.

Headless simulation continues to use `work / rewards` as authoritative progression values. Enemy meshes / animation do not enter domain simulation.

This gives:

```text
Domain stage progress
  -> encounterId
  -> BattleScene selector
  -> Enemy encounter presentation
  -> BattleRuntime
```

Offline / visual runtime が別々の balance truth を持つ構造にはしない。

### 5.4 BattleSceneModel

Extend `BattleSceneModel` with enemy encounter presentation.

Target:

```ts
encounter: {
  id: string;
  displayName: string;
  boss: boolean;
  enemies: readonly BattleSceneEnemy[];
}
```

`BattleCanvas` / `BattleRuntimeOptions` へ enemies を渡し、`BattleRuntime.createEnemies()` の固定生成を削除する。

### 5.5 BattleSnapshot / UI

Remove `BattleScreen.tsx` hard-coded `森のキノコ`.

Snapshot or scene model supplies:

- encounter display name
- boss flag
- alive count
- aggregate HP when useful

Boss時は normal aggregate HUD と同じ見た目に押し込まず、compact boss HP variantを使用できるようにする。

---

## 6. Motion architecture

Add `src/game/enemy-motion.ts` as pure motion source of truth.

Minimum functions:

- `getMushroomIdleMotion()`
- `getMushroomMoveMotion()`
- `getMushroomBumpAttackMotion()`
- `getMushroomHeavyAttackMotion()`
- `getMushroomSporeAttackMotion()`
- `getMushroomHitMotion()`
- `getMushroomDefeatMotion()`
- `getGreatMushroomBossMotion()`

Each function returns semantic pose values, for example:

```ts
{
  squash,
  stretch,
  wobble,
  jump,
  capScale,
  rootYawOffset,
  releaseProgress,
}
```

Game runtime and gallery use the same functions. Gallery-only fake animation is prohibited.

### 6.1 Attack feel

Normal mushroom bump target:

```text
0–25%  anticipation: squat backward
25–55% release: fast forward bounce
55–62% contact: crisp hit
62–100% recovery: elastic settle
```

Routine enemy hit-stop is weaker than major friendly attacks. Enemy attack should read clearly without stealing the player's impact hierarchy.

### 6.2 Cute reaction rule

Enemy hit / defeat should emphasize elasticity and surprise.

Allowed:

- cap wobble
- tiny shocked mouth
- spiral / × eyes
- harmless spore puff
- short sideways topple
- pancake squash

Avoid:

- blood
- broken body pieces
- realistic pain
- dark death fade as primary reaction

---

## 7. Runtime refactor boundary

Do not rewrite all combat before enemy production.

Refactor only enough that enemy content no longer expands the monolith.

Recommended split:

```text
src/game/
├─ BattleRuntime.ts          # phase, target, damage, orchestration
├─ enemies.ts                # enemy content definitions
├─ encounters.ts             # encounter composition
├─ enemy-motion.ts           # pure motion poses/timing
└─ slime-motion.ts           # existing friendly motion
```

If model-loading code becomes substantial, add `battle-model-loader.ts`; do not prematurely introduce a deep class hierarchy.

`BattleRuntime` may still own actual EnemyUnit state and target selection. The key requirement is that species geometry, stats, encounter composition and motion curves are not authored inline there.

---

## 8. First implementation phases

### Phase 0 — baseline / safe refactor

1. Preserve current battle captures for comparison.
2. Add EnemyDefinition / EncounterDefinition types and tests.
3. Add `encounterId` to stage/wave presentation boundary.
4. Pass encounter enemies into BattleRuntime.
5. Reproduce current 3-mushroom battle using data definitions before visual replacement.

Acceptance:

- no change to progression/reward calculation
- current battle still functions
- no hard-coded enemy name in BattleScreen
- runtime no longer decides enemy species itself

### Phase 1 — Mushroom family Blender base

1. Create `tools/blender/enemies/` build pipeline.
2. Build canonical Mushroom family.
3. Export `tiny-mushroom.glb`.
4. Validate front direction in actual Battle camera.
5. Replace procedural Forest Mushroom with GLB.

Acceptance:

- face readable at current portrait gameplay size
- model looks intentionally authored, not primitive placeholder
- no strict side-profile bug
- model is cute before any VFX is applied

### Phase 2 — production motion

1. Extract enemy motion to `enemy-motion.ts`.
2. Implement idle / bounce move / bump attack / hit / defeat.
3. Add expression handling.
4. Tune contact timing against Sword/Bow attack speed.

Acceptance:

- attack has anticipation -> release -> impact -> recovery
- hit reaction does not teleport target
- defeat reaction remains visible in crowded combat
- enemy does not slide across ground

### Phase 3 — roster variants

Parallel after Mushroom family contract is frozen:

- Lane A: ぷくキノコ model + heavy bump motion
- Lane B: ほうしキノコ model + spore projectile/VFX
- Lane C: オオキノコ model + boss tells
- Coordinator: encounter tables / stage integration / QA

Do not edit common family builder independently in parallel lanes after freeze.

### Phase 4 — Great Mushroom boss

1. Integrate boss encounter ID.
2. Add boss HP presentation.
3. Add one heavy telegraph attack.
4. Optionally add one bounded spore action only if first attack is already readable.
5. Add boss defeat sequence.

Initial boss does not need complex phase AI.

### Phase 5 — enemy gallery / acceptance surface

Extend existing production gallery so enemies can be inspected with the exact production GLB + motion functions.

Required modes:

- Front / inspection
- Battle idle
- Move
- Attack
- Hit
- Defeat
- Boss tell where applicable

Do not build a separate fake enemy animation demo.

---

## 9. QA and automated tests

### 9.1 Type / content tests

Add tests that verify:

- every encounter enemy ID resolves
- every stage encounter ID resolves
- every enemy asset path is non-empty
- boss encounter uses boss-class enemy
- no encounter exceeds configured active enemy cap without explicit exception
- enemy definitions have positive HP / speed / interval values

### 9.2 Selector tests

Update `battle-scene.test.ts`:

- stage/wave selects expected encounter
- wave change changes encounter key
- boss stage returns boss presentation
- unrelated currency changes do not recreate visual scene unnecessarily

### 9.3 Motion tests

Pure motion functions should verify:

- outputs remain finite across `u = 0..1`
- release/contact thresholds are ordered
- defeat ends in stable terminal pose
- scale never becomes negative / zero unintentionally

### 9.4 GLB validation

Headless Blender / import validation checks:

- required nodes exist
- transform orientation is accepted
- no missing material
- bounding box within family tolerance
- face is physically on the battle-visible side
- effect origin is outside/at intended emission point

### 9.5 Visual acceptance captures

Preserve lightweight captures under an ignored acceptance path, for example:

```text
.acceptance/enemies/tiny-mushroom/
  front.png
  battle-idle.png
  move.png
  attack.png
  hit.png
  defeat.png
```

Boss adds:

```text
  tell.png
  impact.png
  defeat.png
```

### 9.6 Mobile crowd test

Validate at least:

- 3 enemies + 1–2 slimes
- 6 enemies + 3–4 slimes
- 12 fodder enemies + 6 slimes
- boss + adds + 6 slimes

At maximum normal density:

- enemies may overlap slightly but faces/attacks cannot become an unreadable pile
- friendly job silhouettes remain more visually salient than fodder
- VFX does not hide the boss tell

---

## 10. Performance rules

Normal enemy target remains 3–12 bodies.

Use:

- shared geometry/material where runtime-safe
- bounded polygon count
- pooled projectile / impact VFX
- stable target query cadence
- no SkinnedMesh unless procedural squash/transform cannot meet the visual target

For Mushroom family, prefer transform/morph-based deformation over a full bone rig.

Boss can spend more geometry/VFX budget than fodder, but still targets mobile browser runtime.

---

## 11. Content expansion after Mushroom family

Do not clone Mushroom logic for every area.

Future family direction:

| Area | Enemy family examples | Cute silhouette language |
|---|---|---|
| Clover Road | mushroom | soft cap / bounce |
| Mushroom Forest | fungi + Spore Boar | round snout / colorful fungi |
| Amber Mine | crystal bugs / mini golems | chunky facets / oversized crystal |
| Sunken Marsh | blob frogs / marsh sprouts | broad eyes / wet wobble |
| Frost Ruins | snow constructs | rounded snow mass / tiny ice crest |
| Ember Canyon | ember critters | charcoal body / glowing cheek vents |
| Moonlit Castle | toy-like sentries | squat armor / large helmet |
| Dragon Crater | hatchling creatures | oversized head / tiny wings |

Every family gets its own body grammar. Shared combat behavior IDs are allowed where motion semantics truly match.

---

## 12. Production acceptance gate

An enemy is production-ready only when:

1. GLB is generated from checked-in Blender Python source.
2. Runtime does not procedurally reconstruct its production body.
3. Front/3-4 direction is correct in the actual battle camera.
4. Face reads at gameplay scale.
5. Silhouette communicates role without text.
6. Idle is alive but not distracting.
7. Move does not look like ground sliding.
8. Attack has clear anticipation/release/contact/recovery.
9. Hit reaction is visible and brief.
10. Defeat is cute/comic and readable, not violent.
11. Enemy remains visually subordinate to friendly slimes except bosses.
12. Game and gallery use the same GLB and production motion.
13. Typecheck/tests/build pass.
14. Representative mobile captures are accepted.

---

## 13. Recommended execution order

The highest-value sequence is:

```text
enemy data boundary
-> Tiny Mushroom production GLB
-> shared Mushroom motion
-> Tiny Mushroom full runtime acceptance
-> parallel Plump / Spore / Great Mushroom
-> stage encounter variation
-> boss polish
-> next-area families
```

Do **not** start by mass-producing many enemy models. One excellent tiny mushroom with a reusable family contract is the acceptance reference for every later enemy.

---

## 14. Definition of done for this initiative

This initiative is complete when:

- current procedural placeholder Mushroom is removed from production combat
- Clover Road uses data-driven enemy encounters
- Tiny / Plump / Spore / Great Mushroom have production GLBs
- all four use a shared Mushroom family source rather than copied builders
- enemy motion is reusable and shared by game/gallery
- first boss has readable tell and cute defeat sequence
- BattleScreen no longer hard-codes enemy identity
- stage/wave visibly changes enemy composition
- 3–12 enemy crowd scenes remain readable on portrait mobile
- future enemy families can be added without editing enemy geometry inside `BattleRuntime.ts`
