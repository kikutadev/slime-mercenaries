# Enemy Motion Language

Status: Current
Date: 2026-09-19

## 1. Minimum motion set

全production enemyは以下を必須とする。

- Idle
- Move
- Attack
- Hit
- Defeat

該当時:

- Projectile release
- Projectile flight
- Projectile impact
- Boss arrival
- Boss tell
- Boss secondary impact

## 2. Cute-motion rhythm

基本原則:

1. anticipationを視認できる
2. releaseはanticipationより短く速い
3. contactは明確
4. secondary partが0.05–0.18秒ほど遅れて追従
5. recoveryはsoft settleする

「全身を一定速度で前後移動」だけのattackは禁止する。

## 3. Area escalation

| Area | Normal enemy motion density |
|---|---|
| 2 Mushroom Forest | 1–2 beats。squash/stretchを明確にする |
| 3 Amber Mine | 2–3 beats。crystal / shellなどsecondary massを遅延させる |
| 4 Sunken Marsh | 2–3 beats。inflate / droop / water lagを追加 |
| 5 Frost Ruins | 3 beats。滑り、慣性、光変化を導入 |
| 6 Ember Canyon | 3 beats + elemental after-effect |
| 7 Moonlit Castle | 3–4 beats。weapon/cloth inertia、stop→burstを使う |
| 8 Dragon Crater | 3–4 beats + anticipation FX + delayed impact |

VFX数を増やすだけでは上位Area扱いにしない。

## 4. Idle

Idleは生命感を出すが、戦場の主役にならない。

良いsecondary motion:

- mushroom cap breathe
- crystal sway
- frog throat tiny pulse
- bubble shell lag
- scarf / tail follow-through
- tiny wing flutter

高周波jitterは禁止。

## 5. Move

通常敵はrealistic walk cycleを避ける。

- Mushroom: bounce / wobble
- Mine: roll / burrow / glide
- Marsh: hop / stretch / water-slide
- Frost: roll / slide / soft hop
- Ember: scurry / side-slide / short dash
- Castle: toy hop / float / spring
- Dragon: hop / flutter / short glide

## 6. Hit

Target duration: おおむね0.15–0.30秒。

Hitでは位置teleportではなく、squash / local bend / accessory lag / short recoilを使う。

## 7. Defeat

Defeatはcomic reaction。

Allowed:

- flatten
- topple
- soft half-roll
- droop
- deflate
- sit down
- × eyes

Avoid:

- gore
- broken limbs
- realistic pain
- body parts exploding
- instant fade only

## 8. Boss motion

Bossは最低でも、

anticipation → release → primary impact → delayed secondary reaction → recovery

の5区間で設計する。

Boss defeatは通常敵より長く、最後に「可愛い抜け」を残す。
