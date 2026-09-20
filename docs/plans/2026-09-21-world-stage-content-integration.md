# World Stage Content Integration

Status: Production complete — public battle states verified
Date: 2026-09-21

## Goal

Area 1〜8で制作済みの敵・背景を、通常の自動戦闘進行へ接続する。

最終状態は以下とする。

- 8 Areas × 5 Stages = 40 Stages が連続進行する
- Area 1終了後にArea 2へ、以後Area 8まで自動遷移する
- Area 2〜8 Stage 5は各Areaの制作済みBossへ接続する
- 最終content boundaryはDragon Crater Stage 5 / Star Eater Dragon撃破後だけ
- defeat → retreat → farm → retryの既存ループはAreaを跨いでも維持する
- battle presentationの敵・背景・HUD area表示が同じauthoritative sceneを指す

## Area roster

| Area | Normal enemies | Stage 5 boss |
| --- | --- | --- |
| Clover Road | Leafling / Whirl Leaf / Bud Bloom / Puff Flower / Round Hedgehog / Acorn Squirrel | なし。制作済み6種の最終混成戦 |
| Mushroom Forest | Tiny Mushroom / Plump Mushroom / Spore Mushroom | Great Mushroom |
| Amber Mine | Crystal Beetle / Drill-nose Mole / Crystal Bat / Pebble Golem | Amber Turtle |
| Sunken Marsh | Puff Frog / Marsh Sprout / Bubble Snail / Skimming Lily | Great Marsh Frog |
| Frost Ruins | Snow Roller / Ice Bug / Scarf Snowman / Icicle Lantern | Snow Statue Guardian |
| Ember Canyon | Ember Gecko / Charcoal Roller / Crackle Bug / Magma Crab | Furnace Turtle |
| Moonlit Castle | Round Sentry / Shield Sentry / Bell Mage / Windup Bat | Moon Crown Knight |
| Dragon Crater | Egg Dragon / Tiny-wing Dragon / Star-eater Lizard / Meteor Hatchling | Star Eater Dragon |

Area 1の未制作Boss候補を仮アセットで代替しない。Mushroom familyはArea 2へ移動する。

## Implementation

- [x] enemy runtime catalogを制作済み40体へ拡張
- [x] 全8 Areaのencounter catalogを定義
- [x] Area 1からMushroom enemiesを除外
- [x] Area 2をMushroom専用Areaとして再構成
- [x] Areas 3〜8を4 normal + 1 bossのproduction rosterへ接続
- [x] Area 2〜8 Stage 5に制作済みBossを接続
- [x] Area 1 Stage 5をBossなしの最終混成frontierへ変更
- [x] 8 Area × 5 Stage = 40 StageをDomain定義へ接続
- [x] sequential area unlock / auto-transitionをArea 8まで有効化
- [x] final content boundaryをDragon Crater Stage 5後へ移動
- [x] Areas 2〜8のanalytical combat work / power / reward curveを定義
- [x] first-loop simulatorをClover Road専用評価のまま維持
- [x] battle event payloadへareaIdを追加
- [x] Battle HUDをpresented sceneのareaIdへ同期
- [x] Area跨ぎでもStage arrival presentationが発火
- [x] definition versionを2026-09-21.1へ更新

## Verification

- [x] TypeScript typecheck
- [x] full Vitest: **59 files / 366 tests**
- [x] full-world simulation: **40/40 stages clear**, **7 boss defeats**, **7 area unlocks**
- [x] production build
- [x] headless real-screen QA: **16 battle states**
  - all 8 Area Stage 1
  - Clover Road Stage 5 mixed frontier
  - Area 2〜8 Stage 5 boss
- [x] every QA state loads one real Three.js battle canvas
- [x] all 16 states display the expected area/stage label and authored enemy/boss
- [x] browser/page/resource error list empty
- [x] implementation commit / origin main: `09460c9`
- [x] games.kikuta.dev deploy: Worker `604ab0ae-0d22-41b8-80ff-3c3bfb224209`
- [x] public smoke for all **16/16 battle states**, with one real battle canvas each and no browser/page/resource errors

## Balance note

今回のAreas 2〜8のwork / required power / Goldは、コンテンツ接続を成立させるための初期production curveである。既存のArea 1 first-loop / defeat-loop balance gateは別スコープとして維持している。

後続の本バランス調整では、40 Stage通しの到達時間、敗北頻度、Fusion unlock、Gold消費、装備強化をCLI simulatorで同時評価する。
