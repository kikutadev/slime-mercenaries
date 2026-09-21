# Tier 2 / Tier 3 World Progression

Status: Production complete locally — deploy verification pending
Date: 2026-09-21

## Goal

40 Stageの通常進行を、単に最後まで通れる状態から「制作済みのTier 2 / Tier 3を実際に使いながら世界を攻略する」成長曲線へ移す。

Domainの既存Fusion contractは変えない。

- Rank 2: family-specific enhancement
- Rank 3: Tier 2 job form
- Rank 4: Tier 3 specialization
- Tier 2 minimum Level 20
- Tier 3 minimum Level 40
- duplicate body -> Fusion Core の明示変換を維持
- Tier 3 branch choiceはランダム化しない

## Progression cadence

同職bodyの供給と既存Fusion素材の累積量を再確認したところ、40 Stage全体ではTier 3まで必要な資源総量は既に足りていた。問題は「いつbodyが揃うか」と「旧world simulatorがFusionに向けて育成しなかったこと」だった。

今回の成長目標は次の通り。

| World point | Growth milestone |
| --- | --- |
| Clover Road | Tier 1 / first Rank 2 Fusion |
| Mushroom Forest | Wand / Dagger加入、Shield / Gun用gear確保 |
| Amber Mine | first Tier 2 |
| Frost Ruins | six-family Tier 2 party |
| Ember Canyon | first Tier 3: Sword |
| Moonlit Castle | additional Tier 3: Gun |
| Dragon Crater | remaining families reach Tier 3 before final boss |
| final boss | six-family Tier 3 party |

既存6-family Job Gear cycleは維持する。そのうえで、late-world showcase用のbody milestoneを追加する。

- Ember Canyon Stage 4: Sword Job Gear +1
- Moonlit Castle Stage 4: Gun Job Gear +1
- Dragon Crater Stage 4: Dagger Job Gear +1

これによりDragon Crater最終戦前に全familyで「active body 1 + Rank2/3/4 Core用 spare 6 = 7 bodies」の確定供給を満たす。

## World-reactive simulator policy v2

検証botはstate/resourceを直接改変しない。UIと同じproduction commandsだけを使う。

1. area unlockとJob Gearに従って6職を発見・編成
2. Forge Keyを獲得したら通常Forge commandで消費
3. familyごとに現在所有する最良weaponへ通常equip commandで更新
4. non-Core素材と将来body supplyが確定したFusionだけを育成対象にする
5. Level requirementまで通常Level Upする
6. spare bodyを作成し、必要ならDispatchへ送り、帰還後にFusion Coreへ変換
7. Fusionを実行
8. frontier defeat時は既存の retreat -> 3 farm clears -> strengthen -> retry を継続

Forge/Dispatchを自動化する機能をゲーム本体へ追加するものではない。これはsame-core balance policyであり、実プレイの選択肢をproduction command上で検証するためのもの。

## World scaling

Tier 2 / Tier 3の大きなpower multiplierを入れた後も後半battleが数秒で蒸発しないよう、Area 2〜8のwave work / Gold / frontier powerをarea別curveへ変更する。Area 1のhand-tuned onboarding値は変更しない。

Equipment RNGは攻略速度へ効いてよい。良いForge結果を引いたseedでは一部Areaを無敗突破できるため、「全Areaで必ず負ける」はacceptanceにしない。代わりに20 seedsすべてで、

- total defeat >= 10
- 3つ以上の異なるAreaでdefeat loopを経験
- retry = defeat
- farm clears = defeat x 3

を要求する。

## Dispatch contract

reserve duplicateを育成専用の死蔵bodyにしないため、Fusion Coreへ変換する前に3 contractを一度ずつsame-core policyで実行する。

Required PowerはLv1 normal familyでも参加可能な範囲へ整理する。

- Road Escort: 8
- Forest Exploration: 9
- Material Gathering: 10

Dispatchは主力の必須強化ではなく、余剰bodyに攻略資源を持ち帰らせる副ループとする。

## Acceptance

20 deterministic seedsで以下をrelease gateにする。

- 40 / 40 Stages clear
- 7 Area unlocks
- six jobs discovered
- first Tier 2 = Amber Mine
- first Tier 3 = Ember Canyon
- six Tier 2 Fusions
- six Tier 3 Fusions
- final party: six jobs all Fusion Rank 4 / Job Tier 3
- Forge >= 12 draws
- equipped weapons >= 4 families
- Dispatch starts/completions = 3 / 3
- defeats 10..30
- defeat loop across >= 3 areas
- no-action window <= 120 sec
- existing Clover Road efficient / defeat-loop / paced-defeat gates remain green

Observed 20-seed range during tuning:

- world clear: approximately 7,741..11,928 simulator seconds
- defeats: 12..26
- Tier 2 Fusions: 6 / seed
- Tier 3 Fusions: 6 / seed
- Forge draws: 22 / seed
- Dispatch: 3 starts / 3 completions
- final party: all six Lv.40 / Fusion Rank 4 / Job Tier 3
- max no-action window: approximately 78..85 sec

This simulator time is a same-core active-progress benchmark, not a promised real-player day count. Offline cadence and actual retention timing remain a later product tuning pass.

## Verification

- [x] 20-seed full-world acceptance
- [x] typecheck
- [x] full tests: 62 files / 382 tests
- [x] existing three Clover Road balance gates
- [x] production build / bundle / UI contract
- [ ] origin/main
- [ ] production deploy / public battle smoke
