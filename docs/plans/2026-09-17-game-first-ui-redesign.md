# Slime Mercenaries — Game-first UI Redesign Plan

Status: Implemented — production game-first presentation pass completed 2026-09-17
Date: 2026-09-17
Scope: UI/UX presentation redesign. Domain/Kit state remains authoritative.

Implementation update (2026-09-17):

- Camp now replaces the card-stack Slimes dashboard with a full scene, real 3D slime, physical interaction points, training, arsenal, formation, nursery, and Fusion altar.
- Fusion is a full-screen production workbench with real authoritative consumption, two-slime merge, result form, attack preview, persistent result actions, local item art, source routing, and reload persistence.
- Dispatch is now a route map with real reserve-slime selection, departure, traveling-state visualization, timer persistence, and auto-return semantics.
- Forge is now an animated workshop/machine with charge, hammer impact, sparks, weapon reveal, 10-draw burst rack, pity, and persisted equipment results.
- Bottom navigation is now a floating dock and `Slimes` is presented as `Camp`.
- Released Fusion ingredients now all have authored acquisition routes; a regression test blocks unreachable released recipes.
- 390x844 browser acceptance was run for Camp/Nursery/Fusion/Dispatch/Forge with console/page errors = 0.

The implementation deliberately reuses the existing Domain/Kit controller and battle runtime. No presentation fixture state was introduced.

## 1. Why the current UI is not fun

The current implementation is structurally correct but experientially wrong.

It behaves like a management dashboard around a game rather than the game itself.

Observed problems from the current 390x844 screenshots:

- Battle is visually sparse: a large empty road, small characters, and HUD floating far away from the action.
- Slimes is a stack of rounded white/cream cards with labels, counters, and disabled buttons. The slime itself is treated like a preview inside a form.
- Dispatch is three vertically stacked task cards. It reads like a job queue / admin tool.
- Forge is a large card containing buttons and pity progress. It reads like a gacha settings screen instead of a forge.
- The same visual grammar is used for almost every interaction: header -> card -> text -> button.
- Most player actions change numbers or card states before they visibly change the world.
- Important moments (create, equip, level, fusion, dispatch, forge) do not have enough physical anticipation / consequence.
- The UI relies on typography and explanatory copy where the game should communicate through objects, motion, sound, particles, and spatial transitions.

The problem is not primarily color, spacing, or polish. The interaction model itself is too application-like.

## 2. New product direction

The primary rule is:

> The player should spend most of the session looking at slimes, objects, motion, loot, and places — not cards.

The four gameplay systems remain, but each becomes a game scene rather than a dashboard screen.

Recommended navigation:

- Battle
- Camp (currently Slimes)
- Dispatch
- Forge

The bottom navigation may remain for accessibility and speed, but the destination itself must feel like entering a place.

## 3. Shared visual / interaction grammar

### 3.1 Full-bleed scene first

Each destination owns a full-screen visual scene. Cards are overlays used only for short contextual information.

Do not build another screen from a vertical stack of white rounded rectangles.

### 3.2 One hero interaction per screen

Every screen has one immediately understandable thing to touch:

- Battle: the ongoing fight / chest / reward
- Camp: the selected slime
- Dispatch: the map route / waiting slime
- Forge: the forge machine / anvil / key slot

Secondary information is revealed after interaction.

### 3.3 Cause -> physical reaction -> reward

Every important action must change the scene before or at the same time as it changes numbers.

Examples:

- Level up: slime squashes, jumps, emits one strong pulse; level number pops near body.
- Equip: weapon physically flies in / swaps on the slime.
- Fusion: two bodies meet, flash, upgraded silhouette appears, then attacks.
- Dispatch: slime hops onto the route and walks off-screen.
- Forge: key enters machine, machine charges, impact/sparks, weapon is ejected/revealed.
- Chest: chest lands in battlefield, bounces, opens, reward flies toward destination.

### 3.4 Minimize explanatory text

The screen should show state visually. Text is for names, quantities, missing reasons, and one-line behavior descriptions.

Avoid uppercase section-kicker + heading + paragraph + status pills repeated everywhere.

### 3.5 Game controls are chunky and tactile

Primary buttons should look pressable and responsive, with scale/press depth and strong state change.

Disabled controls should not dominate the screen. Hide or demote actions that are not currently relevant.

## 4. Screen 1 — Battle becomes the home game screen

Battle is the default destination and should be where the player wants to remain.

### Composition

Use approximately:

- top 10–12%: compact area/stage/resource HUD
- middle 68–72%: moving battlefield
- lower 12–16%: party quick bar + contextual reward/action
- bottom nav: minimal

### Changes from current

- Increase the apparent character/action scale.
- Reduce empty road. Camera should frame allies and enemies as a readable combat cluster, not distant miniatures.
- Enemies should enter from upper field, allies advance slightly, and environment should scroll between waves.
- Stage progress is integrated as a thin road/progress marker rather than a large admin-like bar.
- Gold/material rewards visibly pop from enemies and travel into the HUD.
- A chest appears as an actual battlefield object.
- Boss introduction temporarily changes framing and camera rather than adding another card.

### Persistent delight

The fight should have enough motion even when the player does nothing:

- idle jelly motion
- small repositioning
- attacks with clear anticipation/release
- enemy defeat
- ally celebrate/march between waves
- ambient flowers/grass/particles
- short reward flights

The idle loop itself must be pleasant to watch.

## 5. Screen 2 — Camp replaces the current Slimes dashboard

Camp is a character space, not a roster spreadsheet.

### Base composition

A bright small camp/training-yard scene fills the screen.

Selected slime stands large in the center/lower-middle. Other owned slimes appear as smaller clickable residents around the camp or as a compact carousel along the edge.

Physical interaction points exist around the selected slime:

- weapon rack -> equipment
- training dummy / coin pouch -> level
- fusion altar -> fusion
- promotion gate/banner -> promotion
- formation flag -> formation

The player can tap the slime itself for detail, but the default view is not a stat card.

### Selected slime HUD

Keep only a compact overlay:

- name
- Lv / Fusion Rank
- assignment icon
- equipped weapon icon

Detailed stats live in a drawer, not permanently on screen.

### Level up

Level Up should be a tactile repeated action:

- bottom compact control: +1 / +10 / MAX
- tap causes immediate slime reaction
- Gold flies from HUD to slime / training object
- level value rises near character
- milestone levels trigger stronger reaction

This makes spending Gold feel like doing something to the character rather than editing a row.

### Formation

Do not show six empty white cards permanently.

Tap the formation flag to raise a formation tray over the lower third. Six slots appear temporarily. Drag/tap owned slimes into them, confirm automatically, then tray dismisses.

## 6. Fusion becomes a game event inside Camp

Fusion is not a card and not a separate form page by default.

Tap the Fusion altar.

The Camp camera moves/zooms to the altar and transitions into the fusion workbench scene:

- current slime on left pedestal
- duplicate/core represented as a second slime or condensed slime-core body on right
- ingredient objects placed physically around the altar
- missing ingredient slots are visibly empty and tappable
- center sigil pulses when ready

When Fuse is pressed:

1. ingredients lift / dissolve into sigil
2. left/right slimes compress and pull inward
3. contact hit-stop + flash
4. upgraded form appears at same body size
5. new attack is immediately demonstrated against a dummy
6. result stays in scene with `Battleで試す`

The surrounding Camp remains the mental model; this should feel like a special station inside the player's base, not navigating to a SaaS workflow.

## 7. Screen 3 — Dispatch becomes a map / journey scene

Current stacked task cards must be replaced.

### Composition

Use a stylized map/road board occupying most of the screen. Three initial routes are visible as places on the map:

- Road Escort: village/road icon
- Forest Exploration: forest icon
- Material Gathering: quarry/field icon

Each route visually shows:

- reward icon
- duration
- whether a slime is currently traveling
- completion sparkle/chest when ready

Tap a route -> a lower sheet shows eligible reserve slimes as character portraits. Choose one -> slime physically hops from the bottom/camp marker onto the route and starts moving.

Active runs should show the slime moving along the route, not just `1 active` and a progress bar.

Completed dispatch should end with the slime returning carrying a bag/chest and the reward popping out automatically.

## 8. Screen 4 — Forge becomes an actual machine

The forge screen should center a large animated forge/anvil/magic furnace object.

### Composition

- top: Forge Key count, small pity indicator
- middle 60%: forge machine and weapon reveal stage
- bottom: `1x` and `10x` controls
- collection button is secondary, not permanently occupying half the screen

### Interaction

One forge:

1. player taps Forge
2. key physically enters slot
3. furnace charges / hammer hits
4. rarity-colored spark / silhouette
5. weapon rises/spins out
6. NEW or refinement result locks in

Ten forge:

- one machine sequence
- burst of ten result tiles afterward
- highest/new item gets the full reveal
- duplicates collapse quickly into refinement sparks

The current pity bar can remain, but should be subordinate to the forge fantasy.

## 9. Navigation and transitions

Keep bottom navigation for usability, but reduce the application feeling.

Recommended:

- icon + short label
- transparent/blurred floating dock, not a full-width white application tab bar
- selected destination gets physical depth/glow, not a large pale rectangle

Transitions should feel spatial:

- Battle -> Camp: quick field fade / camera travel
- Camp -> Fusion: camera zoom to altar
- Camp -> Forge: short wipe/door/hammer transition
- Dispatch: map unfolds / slides in

Do not use generic page fade for every important transition.

## 10. Reward / feedback hierarchy

A game UI needs a reward heartbeat.

Routine:
- coin/material pop
- tiny bounce
- no modal

Meaningful:
- new weapon
- Fusion ready
- Promotion ready
- dispatch return
- chest

Use stronger motion/sound but still short.

Major:
- NEW job
- Fusion milestone
- Mythic weapon
- boss clear

Temporarily take control of the composition for 1–2 seconds.

## 11. First five minutes target experience

The first session should not begin with a blank management screen.

Recommended flow:

1. Player sees a Plain Slime physically in Camp with available materials nearby.
2. One obvious creation/training interaction gives it a Sword job.
3. Camera returns to Battle and the new Sword Slime immediately attacks.
4. Enemy drops/currency visibly feed the next action.
5. Recreating Sword produces a visible Core reward.
6. Fusion altar begins glowing when recipe/level is ready.
7. First Fusion is a memorable scene, then player is sent directly back to Battle to watch the new sweep.

The rule is: every menu decision should pay off in the animated world within seconds.

## 12. What to remove from the current implementation

The following visual patterns should not be preserved merely because they already exist:

- large `Slimes`, `Dispatch`, `Forge` page titles consuming top space
- repeated cream/white rounded cards as the primary layout
- large explanatory paragraphs
- permanently visible disabled buttons
- six always-visible empty formation cards
- stacked dispatch job cards
- Forge presented primarily as a dark settings/card panel
- generic uppercase micro-labels on every section
- persistent collection panels when no collection interaction is happening

These can remain temporarily during migration only.

## 13. What can be retained

Keep the engineering foundation:

- authoritative Kit/Domain state
- selectors
- command controller
- persistence/offline progression
- presentation queue
- battle runtime and authored slime models/animations
- Fusion recipe definitions
- current Greatsword attack

The rewrite is presentation architecture, not a rollback of the Domain work.

## 14. Implementation plan

### Phase A — Production world shell

Build the real world-space presentation directly on the authoritative state/actions; no static mock path is accepted:

- Battle home
- Camp
- Dispatch map
- Forge machine

No new progression logic is duplicated in presentation. All actions execute the existing controller/Domain commands.

Acceptance: screenshots/video frames no longer resemble a dashboard.

### Phase B — Camp vertical slice

Implement one complete Sword loop only:

- Sword selected in Camp
- level action
- weapon rack
- formation tray
- fusion altar entry
- Fusion result -> `Battleで試す`

Acceptance: one 60–90 second interaction loop feels like playing with a character, not editing state.

### Phase C — Battle reward heartbeat

Add visible loot flights, chest object, between-wave movement, camera framing improvements, stage transition motion.

Acceptance: 30 seconds of no-input battle remains pleasant to watch.

### Phase D — Dispatch scene

Replace task cards with route map and traveling slime animation.

### Phase E — Forge scene

Replace forge card with physical machine/reveal sequence.

### Phase F — Onboarding / polish

Tune first five minutes, haptics/audio hooks, motion timing, safe areas, reduced motion.

## 15. Acceptance criteria

Do not call the redesign complete based on static correctness.

The UI is acceptable only if:

- a screenshot of each primary destination reads as a game scene before reading text
- the slime or game object is the largest/strongest focal point on Camp/Forge/Fusion screens
- at least 70% of important actions have immediate visual consequence in the scene
- routine play does not require reading paragraphs
- Battle remains enjoyable to watch for 30 seconds without input
- first Fusion feels like a reward event, not a form submission
- Dispatch visibly sends a character somewhere
- Forge visibly forges/reveals an item
- core progression still survives reload/offline and remains Domain-authoritative

## 16. Recommendation

Do not polish the current card-based UI further.

Freeze it as a functional fallback/reference and build the new game-first shell on top of the already-correct Domain/Kit foundation.

The next implementation should begin with **Camp + first Sword Fusion vertical slice**, because that single slice tests the most important product fantasy: `かわいいスライムを触る -> 育てる -> 合成で見た目/攻撃が変わる -> 戦闘で成果を見る`.
