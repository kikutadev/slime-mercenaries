# Clover Road Enemy Visual References

Status: Current internal production reference
Date: 2026-09-19

## Purpose

Area 1 Clover Road の Leaf / Flower / Critter / Clover Ram を制作するための visual reference。

画像自体はproduction assetではない。第三者の固有キャラクターを再現せず、次の抽象要素だけを抽出する。

- body mass ratio
- silhouette hook
- face-to-body ratio
- softness / toy-like simplification
- secondary-motion opportunity

## Leaf

### Local image

`images/area01-leaf-plush.jpeg`

Source:
https://minne.com/items/30511302

Useful:
- leaf / plant motif can remain readable with a very compact rounded body
- felt-like broad leaf shapes read before small facial detail
- simple massing works better than botanical realism

Apply to production:
- Leafling keeps one dominant broad leaf
- Whirl Leaf uses two broad leaves, not many thin blades
- production face stays smaller and quieter than the reference

Do not copy:
- exact face
- exact body/leaf arrangement
- exact colors or construction detail

## Flower

### Local image

`images/area01-flower-plush.jpg`

Source:
https://www.kidrepublic.co.nz/product/jellycat-fleury-sunflower/fleu2s.aspx

Useful:
- large center mass + a limited number of broad petals is enough to read as a flower
- soft petal thickness creates a plush rather than botanical silhouette
- radial structure is readable at small size

Apply to production:
- Bud Bloom remains a closed vertical bud instead of becoming a small open sunflower
- Puff Flower uses one dominant round head with broad soft lobes
- attack tells come from open/close/compression rather than facial exaggeration

Do not copy:
- exact petal count
- exact face
- exact sunflower color layout

## Forest Critter — Hedgehog

### Local image

`images/area01-hedgehog-plush.jpg`

Source:
https://www.shoppigment.com/products/spunky-hedgehog-1

Useful:
- compact bean / ball body
- quills can read as one soft outer mass instead of individual spikes
- tiny feet are enough for animal identity

Apply to production:
- Round Hedgehog owns one smooth soft-quill shell silhouette
- no realistic individual spine geometry
- roll animation should preserve the plush mass

Do not copy:
- exact fur pattern
- exact muzzle / eye layout
- realistic plush texture as a literal runtime material

## Forest Critter — Squirrel

### Local image

`images/area01-squirrel-plush.jpg`

Source:
https://faoschwarz.com/products/10-big-tails-squirrel-plush

Useful:
- an oversized tail can dominate silhouette while the body remains compact
- body detail can stay minimal once tail identity is strong
- curled tail creates an obvious secondary-motion mass

Apply to production:
- Acorn Squirrel tail is approximately body-scale or larger in silhouette
- tail follow-through is more important than realistic leg animation
- acorn projectile remains secondary to the character silhouette

Do not copy:
- exact sleeping pose
- exact fur treatment
- exact proportions without adaptation to battle camera

## Boss — Clover Ram

### Local image

`images/area01-ram-plush.jpeg`

Source:
https://www.walmart.com/c/kp/ram-stuffed-animal

Useful:
- wool can be treated as one large rounded mass
- thick curled horns create instant species recognition
- short legs support a stable low center of gravity

Apply to production:
- horns are the largest boss hook
- body becomes broader / lower than a realistic ram
- eyes are much smaller than the reference
- wool is authored as large clean clumps / masses, not individual fibers

Do not copy:
- exact face
- exact horn segmentation
- exact color scheme

## Existing detailed family references

The previously authored family reference remains authoritative for fine-grained Leaf / Flower / Forest Critter constraints:

- ../enemy-next-families-reference-v1.md

This Area 1 file narrows those references into the Clover Road lineup and adds the boss direction.

## Cross-roster silhouette target

At 128px grayscale:

```text
Leafling       = one broad leaf / compact
Whirl Leaf     = two-leaf pinwheel / wide
Bud Bloom      = closed vertical bud
Puff Flower    = round radial puff
Round Hedgehog = low bean + quill shell
Acorn Squirrel = pear body + oversized tail
Clover Ram     = large wool mass + curled horns
```

The seven silhouettes must remain recognizable without color.

## Face rule

- normal enemy eye target: 6–10% of total visible height
- normal enemy hard cap: 12%
- Clover Ram does not gain larger eyes because it is a boss
- face should never be the first silhouette feature noticed

## Reference acceptance

A production result passes reference review only when:

- it is clearly original
- the intended mass / silhouette principle survives
- no source-specific costume or facial arrangement is needed for recognition
- the enemy still reads at the actual portrait battle camera
- motion has an obvious secondary part to animate
