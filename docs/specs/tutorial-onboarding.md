# Tutorial / Onboarding Specification

Status: Current
Date: 2026-09-27

## 1. Goal

Tutorial is not a feature tour. It is the shortest playable proof of the product concept.

Within the first 10 minutes, a new player should understand by doing that:

1. Plain Slime is the renewable body source.
2. Giving Job Gear creates a profession.
3. Professions change visible combat behavior.
4. Growth returns to battle as motion / hit pattern / projectile / VFX, not only stats.
5. Losing at the frontier is normal: retreat, farm, strengthen, retry.
6. Same-job slimes remain independent bodies until the player chooses otherwise.
7. Reserve slimes can work through Dispatch.

The player should not need to read a long rules page to explain the game back in those terms.

## 2. Teaching principle

Use:

`short cue -> real action -> visible consequence`

Do not use:

- multi-page modal tours
- arrows pointing at every control before the player needs it
- long system explanations
- terminology before the corresponding action exists
- mascot dialogue that repeats the UI label verbatim

Every tutorial cue must answer one immediate question only.

## 3. Character voice

Tutorial may use short speech bubbles attached to the slime currently involved in the action.

Cute character voice comes from:

- short wording
- pauses
- small uncertainty or delight
- squash / stretch / head-body lean / hop
- looking toward the relevant object or action

Cute character voice does **not** come from a forced sentence ending or catchphrase.

Forbidden default pattern:

- `〜ぷる`
- repeated baby-talk suffixes
- long exposition spoken by a slime

Preferred examples:

- `……ここ、どこ？`
- `これ、ぼくに？`
- `剣だ。`
- `さっきと違う。`
- `負けた……。`
- `まだ終わりじゃないみたい。`
- `今度は勝てるかな。`
- `こっちの仕事、行ってくる。`

The exact wording may be tuned, but the tone stays sparse and natural.

## 4. Speech bubble contract

Speech bubbles are a presentation layer, not saved progression state.

A bubble:

- is at most 2 short lines on the reference 390–430px portrait viewport
- is anchored close enough to the slime that the speaker is obvious
- never covers the slime's eyes or the primary action target
- disappears automatically after the action becomes obvious, or when the player acts
- never blocks battle simulation or idle progression
- may contain one small emphasis phrase, but not a paragraph

System facts that cannot be expressed naturally by the slime may use a compact secondary caption near the actionable control. The slime bubble should remain emotional/causal; the UI caption may state the rule.

Example:

```text
[Slime bubble]
これ、ぼくに？

[Action caption]
仕事道具を渡すと、新しい職業になります。
```

## 5. State model

Do not introduce a parallel tutorial step counter when the current step can be derived from authoritative game state.

Primary cues should be derived from durable state such as:

- Plain Slime stock
- discovered slime forms
- owned slime instances
- level / Fusion readiness
- highest cleared Stage
- retreat farm state
- Dispatch unlock / assignment state

A minimal authoritative milestone flag is allowed when resource counts cannot safely prove that the player performed the action. The production build can virtualize materials as `∞` in development mode, so Plain stock itself is not a reliable first-use signal. `onboarding.first-plain-created` is therefore written only by a successful Plain craft/purchase command and is used to keep the first two tutorial steps deterministic.

Other persisted tutorial state is allowed only when a cue cannot be reconstructed safely from product state, such as:

- player explicitly skipped onboarding
- one-time optional teaching that must never reappear after dismissal

The authoritative game command remains the only thing that changes gameplay state. Tutorial presentation never grants rewards or advances combat itself.

## 6. Speaker ownership

Plain Slime stock is a resource, not a persistent character instance. Do not pretend one stock token is an owned roster body outside the creation ceremony.

Therefore:

- during Plain creation, the newly emerged Plain Slime in the nursery presentation may speak
- during Job Gear handoff, that presented Plain Slime may speak until the resulting persistent job slime is revealed
- after job creation, the resulting persistent slime becomes the visible speaker
- Camp does not keep a fake permanent Plain guide standing beside the player's roster
- Battle cues come from the actual active slime or a non-character UI cue

This preserves the causal fantasy without creating a second hidden mascot character.

## 7. Onboarding sequence

### Step 0 — Empty Camp / first action

Player state:

- no persistent combat slime owned
- tutorial bootstrap materials available

Presentation:

- show the authored Camp and nursery station, not a dashboard wall
- no fake owned Plain Slime is displayed before creation
- the nursery receives a subtle life/water/gel attention motion

Primary action:

`最初のスライムを生み出す`

System caption:

`素材は揃っています`

Acceptance:

- the player has one obvious action
- Battle/Forge/Dispatch must not compete visually for attention before a combat slime exists

### Step 1 — Create Plain Slime

Action:

- player crafts one Plain Slime stock from the authored recipe

Ceremony:

1. materials visibly converge on the nursery vat
2. vat reacts before the result exists
3. Plain Slime emerges with squash/stretch
4. short settle/wobble
5. bubble appears only after the slime is visible

Bubble candidate:

`……ここ、どこ？`

Then, when Sword Job Gear becomes the next relevant action:

`あれ、なに？`

Primary action caption:

`剣を渡してみる`

Acceptance:

- result is understood as a slime being made, not a counter increment
- bubble and motion never obscure the emerging body

### Step 2 — Give Sword Job Gear

Action:

- player chooses Sword job creation

Ceremony:

1. Plain is visible
2. actual sword/job-tool silhouette enters the scene
3. Plain reacts and looks/leans toward it
4. bubble: `これ、ぼくに？`
5. contact flash
6. Sword Slime replaces the Plain presentation
7. Sword Slime gives one excited hop/wobble

Result bubble:

`剣だ。`

Optional secondary bubble after the first readable weapon motion:

`動きやすい。`

System caption:

`仕事道具を渡すと、スライムに職業が生まれます。`

After ceremony:

- resulting Sword Slime is selected
- if a formation slot is open, first discovery may be placed automatically
- next primary route points to Battle

### Step 3 — First combat difference

Goal:

The player must see that job identity is behavior, not only icon/stat text.

Battle presentation:

- Sword visibly steps into range and performs authored slash choreography
- normal Wave remains simple enough that Sword motion is readable
- routine loot is shown in-world without a blocking result modal

First-combat cue should be short and non-blocking. Candidate bubble/callout:

`さっきと違う。`

No attack tutorial button is required; battle is automatic.

Acceptance:

- a new player can identify which unit attacked without damage-number dependency

### Step 4 — First Strengthen

When affordable, Camp surfaces Strengthen as the single contextual next action.

Ceremony:

- Gold visibly leaves resource HUD
- coins converge on selected slime
- selected slime reacts
- level updates at the reveal, not before

Bubble candidate after reveal:

`ちょっと強くなった。`

Do not explain coefficient math in onboarding.

### Step 5 — Discover a second job

Use guaranteed/deterministic early Job Gear such as Bow.

Goal:

Show that different tools create different combat roles.

Bubble during tool handoff may remain minimal:

`今度は弓？`

After battle preview, no long comparison screen is required. The actual attack range/projectile must communicate the distinction.

### Step 6 — Create a duplicate job

Create a second Sword Slime through the same Plain + Sword Job Gear path.

Important:

- do not auto-merge
- do not auto-convert into Core
- show the second Sword as a real persistent individual

Bubble/caption:

`同じ仕事の仲間だ。`

System caption:

`同じ職業でも別の仲間として編成・派遣できます。`

Do not introduce Fusion conversion in the same instant if doing so makes the second body feel disposable.

### Step 7 — First Fusion

After the player has seen that duplicate bodies are real characters, introduce explicit reserve-body conversion / Fusion input.

Teaching order:

1. show selected Sword's next Fusion result
2. show missing/owned recipe items
3. explain that an eligible reserve Sword can be converted into the Sword Slime Core only when the player chooses
4. execute conversion
5. execute first Fusion

Fusion ceremony:

- two same-body-size Sword visuals may be used as the fantasy presentation
- center pull + flash
- resulting Greatsword form keeps slime body dimensions stable
- immediate attack preview demonstrates the new horizontal sweep

Bubble candidate before Fusion:

`もっと強くなれる？`

After preview:

`これなら、届きそう。`

System caption:

`合成では体を大きくせず、武器と戦い方が進化します。`

### Step 8 — First authored defeat

Goal:

Teach the most important idle-loop rule: defeat changes the growth phase; it does not stop the game.

Presentation:

1. authored frontier is strong enough to defeat the current party
2. final slime remains readable in `べちゃっ + ×目`
3. no GAME OVER modal
4. short retreat presentation
5. previous Stage resumes automatically
6. rewards continue visibly

Defeat bubble, if used before/after the flattened pose clears:

`負けた……。`

After retreat begins:

`まだ終わりじゃないみたい。`

System caption:

`勝てない時は一つ前へ戻り、稼いでから自動で再挑戦します。`

Do not tell the player one mandatory build choice. Camp may surface executable Strengthen/Fusion opportunities without claiming one is the correct answer.

### Step 9 — Retry and payoff

After farm/strengthening, the game automatically returns to the uncleared frontier.

Before contact, optional short bubble:

`今度は勝てるかな。`

The ideal payoff is an actual clear, but balance remains authored Domain data; tutorial presentation must not fake a win.

### Step 10 — First Dispatch

When there is at least one eligible reserve persistent slime:

- unlock/surface one simple contract
- choose one reserve slime
- show departure

Bubble candidate:

`こっちの仕事、行ってくる。`

Return bubble:

`持ってきたよ。`

System caption:

`主力以外の仲間も、別の仕事で報酬を持ち帰ります。`

## 8. Navigation gating and visual priority

Onboarding should reduce competition rather than hard-lock every system.

Preferred behavior:

- before first combat slime: Camp creation action visually dominates
- after first job: Battle route visually dominates
- Strengthen/Fusion surfaces only when the corresponding action is meaningful
- Dispatch is not visually promoted before an eligible reserve exists
- Forge does not interrupt the Plain -> Job -> Combat loop

Avoid putting four equally bright navigation destinations in front of a player who has not created the first combat slime.

## 9. Skip and replay

- onboarding may be skipped from a secondary menu, never from a large first-screen confirmation modal
- skip suppresses tutorial speech/callout presentation; it does not alter game state or grant rewards
- Settings exposes a concise replayable `はじめてガイド` for existing saves
- replay does not recreate rewards or reset progression

If skip persistence is implemented, it is the one explicit tutorial-specific persisted flag allowed by this specification.

## 10. Reduced motion / accessibility

Reduced-motion mode:

- keeps speech bubbles and causal ordering
- replaces large hops/spins with smaller squash/stretch/fade transitions
- never removes the information needed to understand the action

Speech bubble text must use normal UI typography and sufficient contrast. Do not bake tutorial text into 3D textures.

## 11. Implementation boundary

Recommended architecture:

```text
Domain authoritative state
  -> application selectors derive onboarding cue
  -> screen chooses presentation location
  -> Camp/Nursery/Battle presentation renders bubble + reaction
```

Selectors may expose semantic cues such as:

```text
id
speaker
surface
message
action
emphasis
```

They must not call commands or mutate state.

Presentation components own:

- speech bubble placement
- reaction animation
- auto-dismiss timing
- focus/highlight treatment

Domain owns:

- resources
- job creation
- roster bodies
- Fusion
- defeat / retreat / retry
- Dispatch

## 12. Acceptance tests

### Headless/domain

- first-use cue sequence derives correctly from authoritative state
- duplicate Sword creation results in another persistent instance
- duplicate is not automatically converted
- Fusion requires explicit eligible reserve conversion where authored
- defeat transitions into retreat/farm/retry without GAME OVER
- tutorial presentation state cannot grant resources or progress

### Mobile visual QA

Reference: 390x844 and 430x932 portrait.

Capture and inspect at least:

1. first Plain emergence + speech bubble
2. Sword tool handoff + bubble
3. first Sword combat attack
4. duplicate Sword result
5. first Fusion reveal
6. flattened defeat + retreat cue
7. retry approach
8. first Dispatch departure

Acceptance:

- slime eyes and tool remain visible under every bubble
- bubble never collides with bottom command panel on the reference viewport
- each cue is readable without pausing combat longer than the authored presentation
- no `〜ぷる` sentence ending appears in tutorial copy
- a reviewer can explain the core loop after the sequence without reading a separate rules page
