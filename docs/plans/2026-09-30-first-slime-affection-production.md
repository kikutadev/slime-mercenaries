# 2026-09-30 — First Slime Affection / Production Rebuild

Status: Complete
Scope: first-play 0:00–3:00, Camp character attachment, first combat presentation, UI hierarchy

## 1. Product problem

The current implementation contains most required systems, but the first session still reads as a sequence of UI forms:

`guide card -> nursery sheet -> craft result -> trial button -> job option -> battle HUD`

That structure explains the rules, but it does not make the player care about the slime. The product concept is therefore present in documents but not yet proven by the rendered experience.

The rebuild target is not “a clearer tutorial”. It is:

> **The player should feel that the same small slime was born in their Camp, failed once, received a sword, changed how it moves, and then left for its first real fight.**

If that continuous character story is not readable without explanatory paragraphs, the first-play experience is not accepted.

## 2. Highest-order acceptance

At 390x844, a first-time player should be able to describe the first 2–3 minutes approximately as:

> “I made this slime. It tried to hit the dummy and bounced off. I gave it a sword. It got excited, could finally cut the dummy, and then went to fight.”

The player should not describe it as:

> “I completed Step 1, selected Sword, then pressed Battle.”

## 3. Design rules

### 3.1 Character before explanation

- The slime or physical Camp object is the visual subject.
- Tutorial prose is subordinate and short.
- Do not place a large explanatory card over the action being taught.
- Do not show “+1” as the primary emotional payoff for a birth/recruit event.

### 3.2 One action, one visible consequence

Every first-play action has one immediate visual answer:

- nursery tap -> vat reacts
- create -> slime visibly emerges
- dummy interaction -> slime charges / impact 0 / rebound
- sword handoff -> actual sword enters / slime reacts / job form reveals
- post-job dummy -> slash / real damage / dummy reacts
- battle route -> slime visibly departs/arrives, then first readable attack

### 3.3 Preserve continuity

The presentation may use stock/temporary Plain visuals before persistent job creation, but the player-facing sequence must make them read as one continuous character story. Avoid arbitrary scene resets, loading placeholders, or unrelated UI between cause and result.

### 3.4 Camp is a place, management is secondary

- Normal Camp entry remains world-first.
- Management panels are not the main first-play surface.
- During onboarding, relevant physical stations/characters carry attention before generic navigation or management buttons.

### 3.5 Affection comes from behavior, not stat systems

Do not add names, affection meters, food, IVs, or character gacha to solve this problem.

First implement lightweight presentation individuality:

- stable per-instance temperament derived from serial/instance ID
- different likelihood/ordering of rest, training, social, inspection behaviors
- no gameplay stat effect
- no new save-schema requirement unless later evidence proves one is needed

The goal is to create observations such as “this one trains a lot” or “this one is always sleeping”, not another progression system.


### 3.5 Loading policy

- A short loading screen at initial application startup is acceptable.
- Do not optimize the initial bundle at the expense of visible mid-session loading or blank menu transitions.
- Prefer preloading/lazy-chunk warm-up during startup/early idle time so Camp, Battle, Dispatch and Forge transitions stay visually continuous.

### 3.6 Direct resident interaction

- Ambient Camp residents are tappable once onboarding no longer owns the scene.
- Tapping a resident focuses that persistent instance in the Camp and gives a short temperament-specific line.
- This is presentation-only; no affection stat, buff, or save migration is introduced.

## 4. Current-state findings

1. `CampEmptyWorld` renders a large guide card plus a large CTA, so text/UI dominates the empty Camp.
2. `NurseryPanel` still presents first birth/job selection as a bottom-sheet workflow.
3. Plain birth result is visually competing with stock/counter/result UI.
4. Plain dummy failure is a good causal idea, but the action is still expressed mainly as a bottom CTA rather than interaction with the scene.
5. First Sword creation already has real 3D handoff/reveal, but the surrounding sheet still makes it read as a form submission.
6. After Sword creation, a large onboarding card tells the player to battle instead of letting the new Sword slime own the transition.
7. First battle framing is too wide for a one-unit onboarding encounter; tutorial copy occupies meaningful screen area.
8. Camp life already has training/rest/chat/inspection motion, but `camp-life/schedule.ts` assigns behavior primarily by slot and time phase rather than persistent instance temperament.

## 5. Implementation phases

### Phase A — Strip first-play UI down to the character story

Goal: remove redundant tutorial-card dominance without breaking authoritative state flow.

Tasks:

- [x] Empty Camp: replace large top guide card with a compact contextual cue near the nursery/CTA.
- [x] Plain trial: action surface visually attaches to the slime/dummy scene; while the action runs, instructional UI fully yields to animation.
- [x] Plain failure: hold the rebound/result beat long enough to read before exposing Sword handoff.
- [x] First job: suppress unrelated nursery controls and make the Sword tool the single visual/action choice.
- [x] First Sword Camp return: replace the large “guide card” with a compact slime-owned bubble + one Battle continuation action.
- [x] Remove redundant “STEP 1 / STEP 2” language where the scene itself establishes ordering.

Acceptance:

- no first-play frame contains two competing tutorial cards
- slime eyes are unobscured in every key frame
- action and consequence occupy the same visual region

### Phase B — Add the missing comparison payoff: Sword vs the same dummy

Goal: prove profession change before sending the player to battle.

Tasks:

- [x] After first Sword reveal, return to Camp with Sword selected.
- [x] Present the same dummy in the same Camp training composition.
- [x] One explicit interaction triggers the authored Sword step-in slash.
- [x] Dummy HP visibly decreases and impact is materially stronger than Plain’s 0-damage body-check.
- [x] Short Sword reaction after the hit; no explanatory paragraph.
- [x] Only after this result does the Battle continuation become visually primary.

State rule:

Do not invent a generic tutorial step counter. If durable one-time completion is required to prevent replay loops, add one narrowly-scoped product milestone analogous to `onboarding.first-plain-trial-complete`.

Acceptance:

- side-by-side memory is obvious: same target, same Camp, different behavior
- a reviewer can explain “jobs change how slimes fight” with the text hidden

### Phase C — First battle becomes a character showcase

Goal: first combat reads as the Sword slime’s debut, not a tiny RTS view.

Tasks:

- [x] Use onboarding-aware camera/framing while party size is one and early combat cue is active.
- [x] Enlarge readable character scale without changing actual combat coordinates/rules.
- [x] Reduce first-combat tutorial card to a small non-blocking character/callout treatment.
- [x] Ensure first authored slash can be visually identified without relying on damage numbers.
- [x] Preserve transition into normal battle presentation after the first-play showcase.

Acceptance:

- Sword face + weapon are readable at 390x844
- enemy hit consequence is visible
- HUD never becomes the largest visual subject

### Phase D — Camp affection: stable presentation temperament

Goal: ambient residents stop feeling like interchangeable scheduled actors.

Tasks:

- [x] Add a pure `CampTemperament` derived from stable instance identity (no save migration).
- [x] Use temperament to bias/rotate training/rest/social/inspection behavior per resident.
- [x] Preserve deterministic/reproducible behavior for QA.
- [x] Keep all effects presentation-only.
- [x] Add at least four visibly different temperament profiles.

Possible profiles (presentation names need not be shown to player):

- eager: trains/inspects weapons more often
- sleepy: rests/yawns more often
- social: seeks pair/chat beats more often
- curious: inspects nursery/altar/world objects more often

Acceptance:

- watching Camp for 30–45s reveals stable behavioral differences between at least two residents
- repeated Camp entry does not randomly redefine who each slime “is”

### Phase E — Management UI hierarchy cleanup

Goal: Camp remains visible even when the player starts managing a slime.

Tasks:

- [x] Reduce sheet height/content shown at first open.
- [x] Selected slime identity and immediate action remain above generic roster tooling.
- [x] Hide or defer actions that are irrelevant to the selected slime/current progression.
- [x] Remove duplicated labels/captions that explain what the button already says.
- [x] Keep a one-tap return to world-only Camp.

Acceptance:

- opening management does not make the game world feel replaced by a settings sheet
- primary action count at any one moment remains visually small

## 6. QA method

This plan is accepted from rendered interaction evidence, not code review alone.

### Primary journey — 390x844

Capture and inspect:

1. fresh Camp
2. nursery attention / open
3. craft start
4. Plain emergence
5. Plain settle + bubble
6. Plain vs dummy before action
7. impact 0
8. rebound / `……効いてない。`
9. Sword presented as the only job tool
10. sword handoff
11. Sword reveal
12. Sword vs same dummy before action
13. Sword slash impact + HP loss
14. Sword reaction
15. Battle departure/continuation
16. first battle arrival
17. first readable Sword slash
18. Camp return

For every screenshot answer:

- what is the visual subject?
- what changed because of the previous input?
- can the player understand it without the paragraph text?
- is the same slime story visually continuous?
- does this look like a shipped mobile game rather than a form/dashboard?

### Secondary viewport — 430x932

Re-run only after 390x844 passes to catch fixed-position/spacing issues.

### Focused automated verification

Use only where it protects product behavior:

- early-game cue selector tests
- any new milestone command/selectors
- Camp temperament determinism tests
- typecheck/build after structural changes

Do not run the full release simulation suite for presentation-only iteration unless a Domain change warrants it.

## 7. Execution order

1. Phase A UI hierarchy and first-play continuity
2. Phase B Sword-vs-dummy payoff
3. Phase C first battle framing
4. Phase D temperament
5. Phase E management cleanup
6. full 390x844 journey capture/review
7. 430x932 follow-up
8. only then integrate/commit/deploy

## 8. Non-goals for this rebuild

- new combat classes
- new enemies
- economy rebalance
- names/nicknames UI
- affection meter
- feeding/petting progression system
- rarity/gacha changes
- new save migration solely for cosmetic temperament
- broad CSS rewrite unrelated to the first-play/Camp hierarchy

## 9. Definition of done

This work is not done when the tutorial is understandable.

It is done when the first session makes the player want to keep the slime they just created, because they have already watched that specific character fail, change, succeed, and go to work.

## 10. 2026-10-01 execution result

- 390x844 first-play journey: PASS, browser errors 0.
- 430x932 secondary viewport journey: PASS, browser errors 0.
- Journey verified through birth, Plain 0-damage trial, Sword handoff, Sword 28-damage retry, first combat, Camp return and management open.
- Camp temperament QA runs for 45 seconds with deterministic eager/sleepy/social/curious routines.
- Ambient resident tap was visually verified: selected resident is focused and responds with a short temperament-specific line.
- Selected residents retain their temperament in the focused hero motion; e.g. sleepy residents visibly narrow their eyes and settle into a softer, lower posture instead of switching to a generic idle.
- Non-battle presentation notices were reduced so returning to Camp does not let a system card dominate the character/world.
- Startup loading is explicitly allowed; mid-session loading/blank transitions remain the thing to avoid.
- Phase E management hierarchy was rechecked at 390x844 and 430x932: selected slime identity is primary, roster/add/codex share one compact row, Camp remains visibly dominant, and world-only Camp remains one tap away.
- Final verification: TypeScript PASS, UI production contract PASS, 81 test files / 485 tests PASS, production build PASS, initial bundle guard PASS, and `git diff --check` PASS.
