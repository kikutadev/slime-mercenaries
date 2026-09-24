# 2026-09-24 — Battle Watch Quality Pass

Status: Completed
Baseline: `origin/main` at `ed74bc1`
Scope: Battle観賞品質 / character readability / temporal feel / sound / HUD restraint

## 1. Goal

『スライム傭兵団』のBattleを、単に自動戦闘が正しく進む画面ではなく、

> 「可愛いスライムたちが職業ごとに違う戦い方をしているので、触らず眺めていたくなる画面」

へ引き上げる。

このpassではゲームルールやバランスを増やさず、既にあるモデル・モーション・VFX・戦闘ループを
実画面で最大限魅力的に見せる。

品質判断は静止画だけではなく、390x844のactual-speed Battleで行う。

## 2. Current diagnosis

2026-09-24 reviewで以下を確認した。

### Good

- 負ける -> 稼ぐ -> 強化 -> 再挑戦 -> 突破のDomain loopは成立
- 6職 + Tier 2 / Tier 3に個別Battle behaviorがある
- 敗北はflatten + × eyesまで実装済み
- 敵HPは個体ごと
- Battle authorityはDomain、BattleRuntimeはpresentationへ分離済み
- Camp / Fusionはスライム自体が画面の主役になり始めている

### Main problems

1. Portrait画面に対してBattle cameraが引きすぎ、地面の空白が大きい
2. meleeが同一接敵点へ寄るため、複数体が「青い塊」に見える瞬間がある
3. 個別に作った職業モーションが、重なりと小ささで読み取れない
4. 通常戦闘でもHUDが一定の存在感を持ち、観戦の邪魔をする
5. 音がなく、hit / slash / shot / defeat / victoryの触感が不足
6. 静止画QAはあるが「数十秒眺めて楽しいか」のactual-speed acceptanceが弱い

## 3. Non-goals

- combat balance変更
- damage / HP / stage progression変更
- active party数変更
- 新しい育成system追加
- body-size invariantを破るrank別巨大化
- Battleを手動操作ゲームへ変更
- UIへ戦闘内部状態を追加表示

## 4. Experience contract

通常Battleで最重要なのは次の順序。

```
1. slimeの顔・silhouetteが読める
2. 誰が何をしているか分かる
3. hit / recoil / defeatが気持ちいい
4. 敵と背景が状況を支える
5. HUDは必要な時だけ注意を取る
```

6体編成でも「群れ」ではなく「6匹の仲間」として読めること。

## 5. Phase 1 — Camera and battlefield composition

### Implementation

- portrait Battle専用camera framingを見直す
- ally/enemy engagement zoneを画面中央付近へ圧縮
- 上下の無意味な地面余白を減らす
- 6 allies + normal encounterが一度に読める範囲でcharacter占有率を上げる
- bossは別途余白を確保し、通常敵と同じcameraに無理に合わせない

### Acceptance

390x844で:

- normal encounterのslime bodyが現状より明確に大きく読める
- ally rear rowからenemy rear rowまで欠けない
- top HUD / party railとcharacterが重ならない
- bossの頭/武器/VFXが切れない

## 6. Phase 2 — Anti-clumping combat staging

### Implementation

- melee combat anchorをslotごとに十分分離
- attack forward motionが同一点へ収束しすぎないようcontact corridorを設ける
- 同一targetへ複数meleeが攻撃しても左/中央/右のbody silhouetteを保持
- rear/rangedは前衛を透過せず見える高さ/奥行きを維持
- presentation stagingのみ変更し、target selection / damage / timing authorityは変更しない

### Acceptance

6職編成で:

- 3体以上のmeleeが同じenemyへ攻撃してもbodyの大半が完全重複しない
- faceまたはweaponのどちらかが各allyについて読める
- attack sourceがVFXだけでなくbody motionから分かる

## 7. Phase 3 — Motion readability and impact

代表6職 + Tier 3をactual-speedで確認する。

- Sword: anticipation -> slash -> settle
- Shield: brace / guard response
- Bow: tension -> release
- Magic: cast anticipation -> release
- Rogue: lateral movement / multi-hit
- Gun: aim -> shot -> recoil

Tier 3は特に「速く・大きくしただけ」になっていないか確認する。

必要に応じて:

- hit-stop duration
- anticipation
- recovery
- lateral offset
- camera shake
- VFX opacity / size

を調整する。

## 8. Phase 4 — Sound

最初はBattleの意味を担う最小セットに絞る。

- slime hop / movement accent
- sword slash
- generic hit
- arrow release / impact
- magic release / impact
- gun shot
- slime defeat
- enemy defeat
- victory / stage clear
- fusion / major rewardはBattle pass後に共通化

方針:

- 音数を増やすことより、attack sourceとimpactが分かることを優先
- mobileでうるさくならない短いSE
- autoplay制約を守り、user gesture後にaudioを有効化
- mute設定を用意する場合もBattle UIへ常設buttonを増やさない

## 9. Phase 5 — HUD restraint

- 通常の「交戦中」は背景に下げる
- victory / defeat / retry / major rewardだけ一時的に強調
- enemy HPは読みやすさを維持
- party railはtap targetを維持しつつ視覚重量を下げる
- battlefieldを覆う説明・ログを追加しない

## 10. Phase 6 — Actual-speed acceptance

Focused QAを用意し、390x844で最低以下を確認する。

1. 2 allies vs onboarding enemies
2. full six-job party vs mixed encounter
3. boss encounter
4. ally defeat
5. stage victory -> march -> next encounter
6. representative Tier 3 signature

静止画は composition確認に使い、motion qualityはactual-speedで判定する。

## 11. Implementation order

```
Phase 1 camera
-> Phase 2 anti-clumping
-> focused rendered QA
-> Phase 3 representative motion tuning
-> Phase 4 sound
-> Phase 5 HUD restraint
-> final actual-speed acceptance
```

## 12. Definition of done

- Battleを30秒以上見ても「空白が広い」「団子で何しているか分からない」が主印象にならない
- 6職の違いがtextを読まずに認識できる
- defeat / victory / major attackが視覚と音で気持ちよく成立
- HUDよりbattlefieldが主役
- Domain combat結果・balance・save semanticsに変更なし
- TypeScript / focused tests / full Vitest / production build PASS
- 390x844 actual-speed rendered acceptance PASS

## 13. Progress — 2026-09-24 first implementation pass

Completed:

- [x] Existing production interaction/live-combat work integrated into `origin/main` at `ed74bc1`.
- [x] Normal Battle camera moved closer; boss keeps a wider authored framing.
- [x] Normal battlefield depth compressed so the fight occupies more of portrait space.
- [x] Six-job party home positions re-authored in screen space so all six bodies remain inside 390x844.
- [x] Melee combat anchors widened.
- [x] Melee attack presentation uses per-slot contact lanes around the same authoritative enemy target; damage/target authority is unchanged.
- [x] Added focused camera/layout/anti-clumping tests.
- [x] Added `battle-watch` browser QA with load-ready gating and actual-speed time slices.
- [x] Routine `交戦中` status and party rail visual weight reduced.
- [x] Battle report peek compacted; detailed elapsed/reward data remains in the sheet and accessible label.

Rendered observations at 390x844:

- all six validation-party slimes remain on-screen; the previous left-edge clipping is removed
- ranged/rear bodies remain separate instead of stacking under the melee row
- simultaneous melee attacks preserve visibly different left/center/right approach lanes
- enemy HUD and bottom controls do not cover the combat cluster
- routine status is subordinate to the battlefield

Verification for this checkpoint:

- focused Battle tests: 34 tests PASS in 0.42s
- full Vitest: 68 files / 429 tests PASS in 2.79s wall time
- TypeScript: PASS in 3.15s
- production Vite build: PASS in 2.14s
- actual-speed `battle-watch` browser QA: PASS in 11.60s
- `git diff --check`: PASS

Next:

1. Phase 3 actual-speed motion readability across the six job families and representative Tier 3 signatures.
2. Phase 4 Battle sound foundation.
3. Phase 6 boss / defeat / victory-transition acceptance, then final HUD tuning if needed.

### Phase 3 checkpoint — Tier 3 actual-speed readability

Completed:

- [x] First visual attack after approach is staggered per party slot so six signatures do not fire on one frame.
- [x] Added full-party Tier 3 Battle QA and single-family Tier 3 Battle QA.
- [x] Added configurable high-frequency family capture for sub-100ms signature timing checks.
- [x] Cannoneer rectangle billboard defect removed; blast is now shaped as fireball core + outer blast + ring + smoke.
- [x] Cannoneer maximum blast footprint reduced while preserving a Tier 3 screen-dominant payoff.
- [x] Ninja smoke/afterimages use shaped ellipse meshes instead of revealing PlaneGeometry rectangles.
- [x] Sniper sight-lock window widened while preserving the long quiet aim.
- [x] Sniper projectile remains fast; only a short post-impact piercing afterglow was added.
- [x] 70ms high-frequency Sniper QA confirms sight lock -> thin piercing line -> recoil is visually present without slowing the projectile.
- [x] Paladin / Archmage / Blademaster reviewed in isolated actual-speed combat and retained as-authored.

Verification at this checkpoint:

- TypeScript: PASS
- full Vitest: 69 files / 433 tests PASS
- production Vite build: PASS
- `git diff --check`: PASS
- Ninja family browser QA: PASS
- Sniper family browser QA: PASS, including 70ms capture cadence
- Cannoneer family browser QA: PASS, including impact/recovery sequence

Next: Phase 4 Battle sound foundation, then boss/defeat/victory acceptance.

### Phase 4 checkpoint — Battle sound foundation

Completed:

- [x] Added a dedicated `BattleAudioSystem` presentation subsystem; Domain combat remains sound-agnostic.
- [x] Added browser-policy audio unlock on first pointer/key interaction.
- [x] Added cue routing for melee hit, projectile hit, ally hit, arrow release, magic release, gun shot, ally defeat, enemy defeat, victory, defeat, and boss landing.
- [x] Added per-cue debounce so multi-unit combat does not collapse into uncontrolled audio spam.
- [x] Added persistent `soundEnabled` runtime setting with migration from the older economy-only settings payload.
- [x] Added Settings sheet sound toggle; no persistent Battle HUD control was added.
- [x] Settings changes are read live by BattleRuntime without rebuilding the rendered encounter.
- [x] Added focused audio/settings/controller tests and browser QA for toggle persistence.

Implementation note:

- Current Battle SE uses a lightweight WebAudio synthesis backend rather than shipping placeholder external audio files.
- This gives production-safe cue timing/autoplay/mute architecture now; authored audio samples can replace the backend later without changing combat presentation contracts.

Verification at this checkpoint:

- TypeScript: PASS in 2.99s
- full Vitest: 70 files / 438 tests PASS in 2.35s
- production Vite build: PASS in 2.10s
- `git diff --check`: PASS
- 390x844 sound-settings browser QA: PASS
- 390x844 Battle watch QA after audio integration: PASS

Next: final actual-speed acceptance for boss, ally defeat, and victory -> march -> next encounter.

### Final acceptance — Completed

390x844 actual-speed acceptance now covers the three terminal/transition cases that were previously missing:

- [x] Dragon boss encounter: boss body, six allies, boss HUD, and dedicated wide camera remain readable during landing/combat.
- [x] Ally defeat: collapse is held until visibly complete; the defeated slime reads as a flattened body with explicit `× ×` eyes before the result overlay.
- [x] Defeat result: defeat messaging and retreat/retry state are presented after the authored collapse.
- [x] Victory: stage-clear overlay and six surviving slimes remain readable together.
- [x] Victory transition: the same party marches into the next stage and combat resumes without stale result UI.
- [x] Final QA stores both `acceptance-ally-defeat-expression.png` and the subsequent result-overlay screenshot so the required expression cannot regress unnoticed.

Defeat-expression correction made during acceptance:

- the generated × eyes were moved out of model-specific `FaceRoot` hierarchy and attached to `SlimeRoot` as dedicated presentation overlays
- their position follows body squash while their glyph size remains readable at phone scale
- defeat glyphs ignore depth testing so a slime facing away from the camera cannot hide the mandatory expression behind its translucent body
- the glyph was increased to a phone-readable pale cross while preserving the normal-eye state outside defeat

Final verification:

- TypeScript: PASS
- full Vitest: 70 files / 438 tests PASS
- production Vite build: PASS
- `git diff --check`: PASS
- final browser acceptance (`battle-final`): PASS
- boss landing screenshot: PASS
- defeat collapse + `× ×` screenshot: PASS
- defeat result/retreat screenshot: PASS
- victory screenshot: PASS
- next-stage continuation screenshot: PASS

## 14. Completion judgement

The Battle watch-quality pass is complete. The next quality work should be treated as a new scope, not as unfinished work in this plan.

The current Battle surface now satisfies the intended hierarchy: character readability first, authored job motion second, impact/sound third, environment/HUD support last. Domain combat authority and balance were not changed by this pass.

### Production deployment — 2026-09-25

- [x] validation-mode production build (`VITE_VALIDATION_MODE=true`) completed from the accepted worktree
- [x] synced accepted `dist` into the clean `games.kikuta.dev` portal build without touching the stale/dirty canonical slime worktree
- [x] Cloudflare Worker deployed successfully
- [x] Worker Version ID: `0bc5afb8-4a10-4055-8537-65bbc445d69e`
- [x] public HTML references accepted bundle `assets/main-BlSVPTyG.js`
- [x] public Battle bundle/settings content returns HTTP 200
- [x] 390x844 public Battle smoke: six-job party, enemy HP, validation Gold infinity, and live combat PASS
- [x] 390x844 public Settings smoke: Battle SE toggle present and enabled by default PASS
- [x] the only observed HTTP 404 is Cloudflare Browser Insights `/cdn-cgi/rum?`; no game asset 404 was observed

Public URL: `https://games.kikuta.dev/slime-mercenaries/`

The watch-quality pass is therefore complete in both source and production.
