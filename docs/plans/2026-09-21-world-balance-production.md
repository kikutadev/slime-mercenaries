# Full-world Balance Production

Status: Superseded by 2026-09-21-tier3-world-progression.md
Date: 2026-09-21

> Historical baseline: this document records the Rank-2 world milestone before Tier-3 pacing, Forge and Dispatch were integrated into the full-world balance gate.

## Goal

Area 1〜8の40 Stageを「通れる」だけでなく、通常プレイの資源経路と負けゲー型ループが最後まで破綻しない状態にする。

今回の対象は長期の最終数値調整ではなく、全6職を通常Domain commandだけで確定入手でき、Fusion用body supplyも確定し、Area 2〜8で敗北 → 1 Stage戻る → 3回farm → 強化 → 再挑戦が実際に起き、40 Stageをsame-core simulatorで最後まで到達できる状態である。Area 1の既存first-loop balanceは維持する。

## Problems found

40 Stage接続後の全世界simulationで、trainingShield / trainingWand / trainingDagger / trainingGun にproduction上の確定入手経路がなく、Area 2〜8のrequired powerも6体編成に対して低すぎることを確認した。また既存 scripts/simulate.ts はClover Roadの旧終了理由と旧summary fieldを参照していた。

## Deterministic Job Gear

| Job | Area gate | 初回の確定gear |
| --- | --- | --- |
| Sword | Clover Road | tutorial bootstrap |
| Bow | Clover Road | Clover Road Stage 3 |
| Wand | Mushroom Forest | Clover Road Stage 5 clear |
| Dagger | Mushroom Forest | Clover Road Stage 5 clear |
| Shield | Amber Mine | Mushroom Forest Stage 5 clear |
| Gun | Amber Mine | Mushroom Forest Stage 5 clear |

Areas 2〜8の各Stage clearには6職のJob Gearを循環配置し、Mushroom Forest Stage 5ではShield/Gunを追加補充する。全世界を一度clearした時点での確定供給は Sword 8、Shield 7、Bow 7、Wand 7、Dagger 7、Gun 7。

現行Fusion Core recipeはRank 2/3/4で1 + 2 + 3 = 6 spare bodiesを要求するため、active body 1体と合わせて7個/職あれば、ランダムdrop無しでも各職をRank 4まで進めるbody supplyが存在する。

## Full-world simulation policy

world-reactive は検証用player policyであり、ゲーム本体に自動育成を追加するものではない。stateや資源を直接書き換えず、すべてproduction commandを使う。

- 新Areaで解禁された職をJob Gear + Plain Slimeから作成
- 6職を通常formation commandで編成
- Fusion素材が揃ったときだけduplicateを作り、reserve bodyをFusion Coreへ明示変換
- 作成済みFusion recipeを通常commandで実行
- 新Stageへ入ったとき、編成中の最低Levelを1回だけLevel Up
- frontier defeat後は各farm phaseで1回だけLevel Up
- それ以外は通常combat boundaryまで待機

## Authored power gates

Area 1は既存hand-tuned onboarding値を維持する。Areas 2〜8はStage 3にnormal frontier gate、Stage 5 Bossにbase + 5のBoss gateを置く。

| Area | Stage 3 | Stage 5 Boss |
| --- | ---: | ---: |
| Mushroom Forest | 40 | 45 |
| Amber Mine | 72 | 77 |
| Sunken Marsh | 80 | 85 |
| Frost Ruins | 115 | 120 |
| Ember Canyon | 165 | 170 |
| Moonlit Castle | 180 | 185 |
| Dragon Crater | 205 | 210 |

## Acceptance gate

20 deterministic seedsで world-clear、40/40 Stage、Area unlock 7回、全6職discovery、defeat 8〜14回、Areas 2〜8の全7 Areaで最低1回defeat、retry = defeat、farm clear = defeat × 3、全6職Fusion Rank 2以上、no-action window <= 90 secを要求する。Area 1 efficient / defeat-loop / paced-defeat既存gateも維持する。

現在の20-seed結果は全seedで world clear 4666 sec、defeats 10、farm clears 30、retries 10、level ups 90、Fusions 6、max no-action window 60 sec、最終partyは6職すべてLv.16 / Fusion Rank 2。defeat内訳は Mushroom 2 / Amber 2 / Marsh 1 / Frost 1 / Ember 2 / Castle 1 / Dragon 1。

## Scope after this milestone

Tier 2 / Tier 3までを40 Stage内で必ず到達させることは今回のacceptanceにはしない。次の長期balance passでは、実プレイ時間、放置時間、Tier 2/3到達Area、Equipment、派遣収益をまとめて評価し、40 Stageそのものを何日で終えるかを設計する。

## Verification

- [x] TypeScript typecheck
- [x] full Vitest: 59 files / 370 tests
- [x] Area 1 efficient 20-seed balance gate PASS
- [x] Area 1 defeat-loop 20-seed balance gate PASS
- [x] Area 1 paced-defeat 20-seed balance gate PASS
- [x] full-world 20-seed acceptance gate PASS
- [x] production build PASS
- [x] origin/main implementation commit: 8f7002c
- [x] games.kikuta.dev deploy: Worker 733fd548-e6ab-4333-9da6-f1eedd730b50
- [x] public smoke: 16/16 authored battle states PASS, browser/page/resource errors 0
