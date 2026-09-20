# Area 3–8 Enemy Asset & Gallery Production Roadmap

Status: Production set complete — Areas 3–8 enemy production complete; Area 8 publicly verified
Date: 2026-09-21

## Scope

この計画の作業スコープは **新規敵キャラクターの制作からproduction galleryへ掲載するところまで**。

含む:
- visual reference / silhouette design
- Blender Python source
- generated GLB
- validation
- character-specific Idle / Move / Attack / Hit / Defeat
- projectile / VFX required for gallery playback
- Gallery registration
- Gallery camera / playback QA
- screenshots / production build verification

含まない:
- encounter composition
- stage definitions
- area progression
- HP / damage / interval / loot / game balance
- normal-play unlock
- battle-system integration

ゲーム側への接続は別作業スコープで扱う。

## Target roster

Area 3 Amber Mine:
- ころクリ / `crystal-beetle`
- つるはしモグ / `drill-nose-mole`
- きらコウモリ / `crystal-bat`
- ゴロゴーレム / `pebble-golem`
- 琥珀ガメ / `amber-turtle`

Area 4 Sunken Marsh:
- ぷくガエル
- ぬまメ
- あわタニシ
- すいすいハス
- おおぬまガエル

Area 5 Frost Ruins:
- ゆきころ
- こおりムシ
- マフラー雪だるま
- つららランタン
- 雪像の番人

Area 6 Ember Canyon:
- ひのこヤモリ
- すみころ
- ぱちパチムシ
- マグマガニ
- 炉心ガメ

Area 7 Moonlit Castle:
- ころ兵
- たて兵
- ベル魔導兵
- ぜんまいコウモリ
- 月冠の騎士

Area 8 Dragon Crater:
- たまごドラゴン
- こつばさ竜
- 星くいトカゲ
- りゅうせいヒナ
- 星喰らい竜

Area 3–8は通常敵24体 + Boss 6体 = 30体。

Area 1 Boss candidate `クローバーラム` はcontent hard-lock前のため、この30体とは別管理。

## Production order

1. Area 3をproduction gallery vertical sliceとして完成
2. Area 4以降はキャラごとにcontractを先に定義し、一体ずつ全gateを通す
3. 同Areaの通常4体 + Bossを並べたsilhouette QAを通してから次Areaへ進む
4. Area 8は同じcontract方式のまま、最終Area向けにmotion density / secondary reactionを強化する

Area 3 acceptance前にArea 4以降を雑に量産しない。

## Area 3 progress

- [x] visual-reference board
- [x] separate `mine` Blender family
- [x] 5 Blender Python definitions
- [x] 5 generated production GLBs
- [x] eye-size / silhouette / required-node validation
- [x] 5 Gallery registrations
- [x] crystal-ring projectile
- [x] character-specific Idle
- [x] character-specific Move
- [x] character-specific Attack
- [x] character-specific Hit
- [x] character-specific Defeat
- [x] ころクリ crystal secondary lag
- [x] モグ dig / sink / pop
- [x] コウモリ wing open/close + ring shot
- [x] ゴーレム rock-cluster gather/separate
- [x] 琥珀ガメ head retract + shell roll + delayed wobble
- [x] defeat face follows body deformation; no independent face escape
- [x] boss-aware Gallery camera
- [x] Gallery URL state for slime / motion / camera / speed
- [x] motion tests / catalog tests
- [x] TypeScript typecheck
- [x] production build
- [x] all 15 current enemy GLBs validate
- [x] Area 3 assets return HTTP 200 from production gallery build
- [x] Attack / Defeat headless gallery captures for all 5
- [ ] final manual visual pass at 1x for all 25 state combinations
- [ ] Area 3 marked final after that visual pass

## Area 4 progress

- [x] separate `marsh` Blender family
- [x] 5 Blender Python definitions
- [x] 5 generated production GLBs
- [x] silhouette / eye-size / required-node validation
- [x] 5 Gallery registrations
- [x] character-specific Idle / Move / Attack / Hit / Defeat
- [x] ぷくガエル throat inflate + hop + pancake settle
- [x] ぬまメ stretch / broad-leaf lag + water-orb projectile
- [x] あわタニシ delayed bubble-shell motion + soft deflate
- [x] すいすいハス low-profile glide / skim / slow-spin defeat
- [x] おおぬまガエル three-step throat inflation + still hold + release + delayed wobble
- [x] ultra-flat lily uses a dedicated smaller eye footprint and passes the 12% eye cap
- [x] defeat × eyes scale from each model's authored eye footprint
- [x] targeted tests / typecheck / production build
- [x] full current 20-enemy GLB validation
- [x] all 5 Area 4 assets return HTTP 200 from the production Gallery build
- [x] Attack / Defeat headless Gallery captures generated for all 5
- [ ] final subjective visual polish pass

## V2 quality reset — 2026-09-20

The first Area 3/4 pass was rejected for insufficient character-model quality.
Do not use that pass as the baseline for later areas.

V2 changes:

- [x] Area 5 partial generation work discarded before acceptance
- [x] Mine family generator rebuilt at model-grammar level
- [x] Marsh family generator rebuilt at model-grammar level
- [x] body / underside / face / mouth / cheek / feet / secondary mass separated where appropriate
- [x] crystal bat generic ellipsoid wings replaced by dedicated beveled scallop meshes
- [x] marsh sprout stacked-sphere body replaced by one-piece deformed droplet mesh
- [x] skimming lily uses a dedicated notched/beveled pad mesh
- [x] golem / lily / amber-turtle FaceRoot follows the actual moving primary mass
- [x] marsh water material reduced in gloss/transmission so enemies do not read as friendly slime
- [x] undersized normal enemies rescaled in Gallery for 1x readability
- [x] 128px monochrome silhouette QA added as an acceptance check
- [x] Area 3 max pairwise silhouette IoU = 0.537
- [x] Area 4 normal/boss silhouette issue found and corrected
- [x] puff-frog vs great-marsh-frog silhouette IoU reduced from 0.757 to 0.429
- [x] great-marsh-frog changed from same-ratio scale-up to tall two-level mass + hanging giant throat silhouette
- [x] 20-enemy GLB validation passes after V2 rebuild
- [x] Area 3/4 motion + Gallery tests: 23/23 pass
- [x] TypeScript typecheck and production build pass
- [x] all 10 Area 3/4 public GLB SHA-256 hashes match local V2 artifacts
- [x] public Gallery model-load probes pass for Area 3/4 representative Attack / Defeat states
- [x] deployed to games.kikuta.dev, Worker version `20523648-888f-446e-9561-4700ec6fa552`

Area 5 V2 baseline was verified, then produced under the contract-first workflow below.

## Area 5 progress — Frost Ruins

- [x] all 5 character contracts written before Blender implementation
- [x] separate `frost` Blender family
- [x] 5 Blender Python definitions with character-specific `VALIDATION_PROFILE`
- [x] 5 generated GLBs: `snow-roller`, `ice-bug`, `scarf-snowman`, `icicle-lantern`, `snow-statue-guardian`
- [x] per-character silhouette / hook-size / mesh-budget / required-node / forbidden-node gates
- [x] eye-size hard cap retained; `ice-bug` was corrected rather than relaxing the 12% gate
- [x] 5 character-specific Idle / Move / Attack / Hit / Defeat profiles
- [x] `ice-shard`, `ice-ray`, `frost-icicle` projectile families
- [x] `snow-roller`: low roll → bump → delayed one-nub overshoot
- [x] `ice-bug`: exactly 3 broad spikes → hold → snap → one shard → recoil
- [x] `scarf-snowman`: scarf anticipation precedes body dash; scarf owns follow-through
- [x] `icicle-lantern`: bounded core glow → thin ray → recoil/flicker
- [x] `snow-statue-guardian`: upper mass leads → lower follows → full spin → release → delayed crest settle
- [x] model-collision failures were fixed in geometry rather than by weakening gates
- [x] 128px monochrome Area 5 pairwise silhouette gate passes, max IoU = **0.592** (< 0.62)
- [x] problematic `snow-roller vs ice-bug` reduced to IoU **0.560**
- [x] problematic `snow-roller vs snow-statue-guardian` reduced from 0.780 first pass to **0.592**
- [x] true Three.js camera-projected 1x framing replaces color-based screenshot occupancy measurement
- [x] `icicle-lantern` failed projected area at 2.9%; production scale raised instead of lowering the gate; final area = **3.3%**
- [x] 25 current production GLBs pass Blender validation
- [x] 25 characters × Idle / Attack / Defeat = **75 unique timed Gallery frames**
- [x] all 25 pass true camera-projected 1x framing gate
- [x] Gallery and BattleRuntime now share eye-footprint-scaled defeat × eyes
- [x] legacy sibling `FaceRoot` follows defeat deformation; descendant faces avoid double deformation
- [x] removed BattleRuntime's old independent face escape offsets that could visually detach eyes/face on defeat
- [x] enemy/Gallery/defeat-face targeted test gate: **62 tests pass**
- [x] TypeScript typecheck passes
- [x] production build passes
- [x] public deploy + five-GLB byte verification
- [x] public Gallery model-load / production-duration verification
- [x] public Gallery re-capture: **25 characters / 75 unique timed frames**
- [x] all 5 Area 5 public GLB SHA-256 hashes match local artifacts byte-for-byte
- [x] public Area 5 production durations verified:
  - `snow-roller` 0.86s / 1.10s
  - `ice-bug` 0.98s / 1.16s
  - `scarf-snowman` 0.90s / 1.16s
  - `icicle-lantern` 1.06s / 1.22s
  - `snow-statue-guardian` 1.62s / 1.68s
- [x] deployment Worker version: `3fcc393b-9292-438a-bbfe-486eedf8b58a`

## Area 6 progress — Ember Canyon

- [x] 5 production enemies completed: `ember-gecko`, `charcoal-roller`, `crackle-bug`, `magma-crab`, `furnace-turtle`
- [x] separate `ember` Blender family and character-specific semantic hooks
- [x] 5 character-specific Idle / Move / Attack / Hit / Defeat profiles
- [x] elemental secondary reactions and Ember-specific projectile / glow timing
- [x] `crackle-bug` final silhouette polish: thinner body/underbody, corrected shell mount, wider antenna spread, lower eye line
- [x] Area 1 leaf / flower / critter silhouettes retroactively repaired instead of weakening the production contract
- [x] 30 current production GLBs pass the Blender character validator
- [x] 128px monochrome Area 6 pairwise silhouette gate passes; max IoU = **0.616** (< 0.62)
- [x] targeted enemy motion / face / Gallery gate passes: **49 tests**
- [x] TypeScript typecheck passes
- [x] production build passes
- [x] local Area 6 real-UI capture: **5 characters / 90 timed frames** across Idle / Move / Attack / Hit / Defeat
- [x] full local Gallery production gate: **30 characters / 90 unique timed frames**
- [x] `bud-bloom` 1x production scale corrected from 0.33 to 0.36 after projected-area gate found 2.7%; final projected area = **3.2%**
- [x] production deploy verified at `https://games.kikuta.dev/slime-mercenaries/`
- [x] all 5 Area 6 public GLB SHA-256 hashes match the committed local artifacts byte-for-byte
- [x] public Area 6 Gallery smoke: **5 characters / 15 timed frames** with model-load, occupancy, Attack, and Defeat duration checks
- [x] public Area 6 production durations verified:
  - `ember-gecko` 0.92s / 1.22s
  - `charcoal-roller` 1.10s / 1.28s
  - `crackle-bug` 1.12s / 1.26s
  - `magma-crab` 1.02s / 1.30s
  - `furnace-turtle` 1.68s / 1.78s
- [x] deployment Worker version: `d434f722-a26a-4db0-85fe-935dfde476f9`

## Area 7 progress — Moonlit Castle

- [x] all 5 contracts written before Blender implementation: `round-sentry`, `shield-sentry`, `bell-mage`, `windup-bat`, `moon-crown-knight`
- [x] separate `castle` Blender family with character-specific semantic roots for helmet / shield / clapper / winding-key / cape / blade
- [x] 5 generated production GLBs with per-character geometry gates and forbidden-structure rules
- [x] stop → burst and equipment-inertia motion language implemented as character-specific Idle / Move / Attack / Hit / Defeat
- [x] `round-sentry`: spear pullback → readable stop → burst thrust → delayed helmet catch-up
- [x] `shield-sentry`: shield plant → still hold → one short bash → rebound
- [x] `bell-mage`: left/right bell swing → center stop → one sound ring → delayed clapper after-ring
- [x] `windup-bat`: body/wing stop → key reverse-wind → hold → moon-bolt release → delayed wing catch-up
- [x] `moon-crown-knight`: low stance → dash → full stop → delayed slash line → cape catch-up; attack / defeat use boss-length timing
- [x] 128px monochrome Area 7 silhouette gate passes; max pairwise IoU = **0.602** (< 0.62)
- [x] 35 current production GLBs pass the Blender character validator
- [x] targeted enemy motion / face / Gallery gate passes: **59 tests**
- [x] TypeScript typecheck passes
- [x] production build passes
- [x] local Area 7 real-UI capture: **5 characters / 90 timed frames** across Idle / Move / Attack / Hit / Defeat with no browser errors
- [x] full local Gallery production gate: **35 characters / 105 unique timed frames**
- [x] production deploy verified at `https://games.kikuta.dev/slime-mercenaries/`
- [x] all 5 Area 7 public GLB SHA-256 hashes match the committed local artifacts byte-for-byte
- [x] public Area 7 Gallery smoke: **5 characters / 15 unique timed frames** with model-load, occupancy, Attack, and Defeat duration checks
- [x] public Area 7 production durations verified:
  - `round-sentry` 1.00s / 1.30s
  - `shield-sentry` 1.10s / 1.36s
  - `bell-mage` 1.28s / 1.42s
  - `windup-bat` 1.08s / 1.38s
  - `moon-crown-knight` 1.72s / 1.84s
- [x] deployment Worker version: `a4c1c509-0309-4872-9303-014360fb7884`

## Area 8 progress — Dragon Crater

- [x] all 5 contracts written before Blender implementation: `egg-dragon`, `tiny-wing-dragon`, `star-eater-lizard`, `meteor-hatchling`, `star-eater-dragon`
- [x] separate `dragon` Blender family with semantic roots for head / shell / wing-pair / star-glow / twin motes / tail
- [x] 5 generated production GLBs with character-specific geometry, mesh-budget, required-node, forbidden-node, and dominant-hook gates
- [x] final-Area escalation implemented as anticipation FX + readable still hold + release + delayed secondary impact rather than simple speed / particle inflation
- [x] `egg-dragon`: inhale / throat inflate → held breath → one fireball → recoil → delayed eggshell shake
- [x] `tiny-wing-dragon`: three failed flaps → brief hover → wing fold → one successful short dive → delayed tiny-wing flutter
- [x] `star-eater-lizard`: one back-star drains → body compression / hold → charged dash → delayed star relight and rebound
- [x] `meteor-hatchling`: body stays still while exactly two motes counter-orbit / rise → merged hold → one meteor → two-mote orbit reforms
- [x] `star-eater-dragon`: seven-beat final-Boss signature with crouch → wing close → star pull-in → 0.163s held anticipation → wing burst → contact → 0.143s delayed tail / star-ring reaction → recovery
- [x] 128px monochrome Area 8 silhouette gate passes; max pairwise IoU = **0.592** (< 0.62)
- [x] all **40** current production enemy GLBs pass the Blender character validator
- [x] targeted enemy motion / face / Gallery gate passes: **69 tests**
- [x] TypeScript typecheck passes
- [x] production build passes
- [x] local Area 8 real-UI capture: **5 characters / 90 timed frames** across Idle / Move / Attack / Hit / Defeat with no browser errors
- [x] each Area 8 motion owns multiple distinct captured frame hashes; the deliberate held anticipation beats remain visible without collapsing the whole motion
- [x] full local Gallery production gate: **40 characters / 120 unique timed frames**
- [x] Area 8 1x inspection occupancy remains readable: egg 0.280×0.248, tiny-wing 0.192×0.261, star-lizard 0.227×0.179, meteor-hatchling 0.242×0.230, boss 0.385×0.359
- [x] production deploy verified at `https://games.kikuta.dev/slime-mercenaries/`
- [x] all 5 Area 8 public GLB SHA-256 hashes match the committed local artifacts byte-for-byte
- [x] public Area 8 Gallery smoke: **5 characters / 15 unique timed frames** with model-load, occupancy, Attack, Defeat duration, and browser-error checks
- [x] public contact sheet visually inspected after deployment
- [x] public Area 8 production durations verified:
  - `egg-dragon` 1.20s / 1.48s
  - `tiny-wing-dragon` 1.20s / 1.46s
  - `star-eater-lizard` 1.28s / 1.52s
  - `meteor-hatchling` 1.40s / 1.58s
  - `star-eater-dragon` 2.04s / 2.12s
- [x] deployment Worker version: `612d96a5-8fbf-46e4-89f8-22f80c500aa4`

## Per-character contract baseline — 2026-09-20

Enemy production no longer accepts family-level completion.

**Rule: 1 character = 1 spec = 1 executable geometry gate = 1 behavior-specific motion gate = 1 timed Gallery QA.**

Current baseline:

- [x] all 20 current production enemies own a per-character `VALIDATION_PROFILE`
- [x] each profile owns silhouette ratio, mesh budget, required structure, forbidden structure where applicable, dominant-hook sizing, and semantic parent rules where applicable
- [x] all 20 current GLBs pass the character-specific Blender validator
- [x] all current enemy families have character-specific motion tests rather than finite-value checks alone
- [x] targeted enemy/Gallery test gate passes: 49 tests
- [x] TypeScript typecheck passes
- [x] production build passes
- [x] deterministic Gallery QA waits for GLB load, replays from time zero, and captures each character's specified Attack / Defeat beat
- [x] 20 characters × Idle / Attack / Defeat = 60 timed Gallery frames captured with no duplicate hashes
- [x] all 20 pass the 520px / 1x framing gate
- [x] Mushroom family now exposes semantic cap pivots; Great Mushroom owns an independent upper-shelf `SecondaryRoot`
- [x] Great Mushroom boss attack rebuilt to hold → slam → delayed upper-shelf reaction → recovery
- [x] Great Mushroom attack / defeat durations are 1.28s / 1.42s
- [x] deployed build verified on games.kikuta.dev
- [x] changed mushroom GLB SHA-256 hashes match public assets byte-for-byte
- [x] public Great Mushroom Gallery reports the new 1.28s / 1.42s production motion durations
- [x] deployment Worker version: `a3c0b11c-1e55-443b-adb3-4c9cefc2d0cf`

Human-readable requirements are maintained in:
`docs/specs/enemies/character-production-contracts.md`.

Area 5 and later MUST define the character contract before Blender implementation starts.
A family definition, generic validator pass, or a single good-looking screenshot is not sufficient evidence of completion.

## Asset architecture

Areaごとにbody grammarを分離する。

```text
tools/blender/enemies/
  families/
    mine.py
    marsh.py
    frost.py
    ember.py
    castle.py
    dragon.py
  definitions/
    <enemy>.py
```

共有するのはprimitive / material / export / validation / semantic motion infrastructureのみ。

各familyは以下を所有する:
- major silhouette masses
- semantic secondary-motion roots
- face placement
- effect origin
- material grammar

## Per-character production contract

一体をGallery完成扱いにする条件:

1. Blender Python source
2. generated GLB
3. silhouette / eye-size / required-node validation
4. dedicated motion profile
5. Idle
6. Move
7. Attack
8. Hit
9. Defeat
10. projectile / VFX if applicable
11. Gallery registration
12. production GLB loaded by Gallery
13. 3/4 / Battle / Front camera確認
14. 1x playback確認
15. attack and defeat captures
16. typecheck / targeted tests / production build

モデルだけ、またはAttackだけ実装した状態は完成扱いにしない。

## Motion escalation

Area 3:
- 2–3 beats
- dominant secondary mass lag

Area 4:
- inflate / droop / water lag

Area 5:
- slide / inertia / glow timing

Area 6:
- elemental after-effectを追加

Area 7:
- stop -> burst
- weapon / cape / winding-key inertia

Area 8:
- anticipation FX
- delayed secondary impact
- boss級は5区間以上

単純な速度・サイズ・particle量だけで上位Areaを表現しない。

## Boss rule

Bossは通常敵の拡大版にしない。

Gallery制作時点で必須:
- unique silhouette
- longer readable anticipation
- primary impact
- delayed secondary reaction
- longer comic defeat
- normal enemyとは異なるcamera scale

## Definition of done

- Area 3–8の30体すべてproduction GLB化
- 30体すべてIdle / Move / Attack / Hit / Defeatを持つ
- 各Areaの通常4体が色なしでも識別可能
- Bossが通常敵の単純拡大ではない
- Galleryから全モデル・全モーションを再生可能
- GalleryのBattle cameraでもシルエットとattack tellが読める
- final Areaほどmotion densityとsecondary reactionが明確に増える
- full GLB validation / tests / typecheck / production buildが通る