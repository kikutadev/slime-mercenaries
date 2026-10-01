# First-play visual interaction audit

Status: Active
Date: 2026-09-30

## Goal

Bring the first-play experience to production quality by inspecting rendered evidence after every meaningful player interaction, not by inferring UX quality from code/tests.

## Reference viewport

- 390x844 primary
- 430x932 follow-up for fixed issues

## Journey A — first playable loop

Capture and inspect, in order:

1. fresh launch / empty Camp
2. tap first-slime CTA -> Nursery opened
3. tap craft -> immediate response
4. Plain emergence mid-ceremony
5. Plain emergence result
6. return to Camp -> Plain vs dummy prompt
7. tap dummy -> impact frame
8. dummy result -> 0 damage / HP unchanged / Plain reaction
9. tap give-sword -> Nursery job selection
10. tap Sword -> handoff/transform mid-frame
11. Sword result
12. return to Camp -> comparison CTA
13. tap Battle -> first battle arrival
14. first Sword attack / hit consequence
15. tap Camp -> Camp return state
16. tap management -> management panel result
17. tap Strengthen -> strengthen panel
18. tap +1 -> strengthen reaction/result

## Journey B — first duplicate / Fusion loop

Use an authored fixture only to remove waiting/grind; do not alter the UI behavior being accepted.

1. open Recruit
2. create second Plain
3. assign Sword -> duplicate persistent body result
4. open Formation and verify duplicate is visibly usable
5. return / open Fusion
6. convert eligible reserve duplicate to Core
7. inspect recipe after conversion
8. tap Fuse -> material gather
9. inspect two-body merge / contact
10. inspect new-form reveal
11. leave reveal untouched for >=2.5s and confirm it does not auto-advance
12. tap new-attack preview
13. inspect attack mid-frame
14. inspect Fusion-complete actions
15. tap Camp result
16. tap Battle and inspect new behavior in combat

## Review criteria per image

For every captured state answer:

- What changed because of the preceding action?
- Is cause -> effect obvious without reading a rules page?
- Is the intended subject visually dominant?
- Are tap target, animation, copy, and result spatially connected?
- Does any panel obscure the thing the player is meant to inspect?
- Is there dead space, temporary mock-looking UI, contradictory copy, or developer-facing language?
- Is the next desired action obvious without turning the experience into a checklist?
- Does the image look like a shipped mobile game rather than a prototype/dashboard?

## Acceptance

No first-play interaction is accepted from tests alone. Each material state must have inspected screenshot evidence. Timing-dependent transitions additionally require actual-speed browser play.