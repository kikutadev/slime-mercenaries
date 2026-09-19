# Area 3–8 Enemy Asset & Gallery Production Roadmap

Status: Active — Area 3 / Area 4 V2 rebuilt, validated and publicly deployed; Area 5 remains gated on this quality baseline
Date: 2026-09-20

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
2. Area 4 / 5をfamily単位で制作
3. Area 6 / 7をfamily単位で制作
4. Area 8を最終Area品質として制作

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

Area 5 stays paused until this V2 set is verified in the public Gallery.

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