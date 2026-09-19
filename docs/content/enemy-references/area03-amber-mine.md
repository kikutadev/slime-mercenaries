# Area 3 — Amber Mine Visual References

Status: Active production reference
Date: 2026-09-19

## Purpose

Area 3の5体を同じ「茶色い鉱山モンスター」にせず、128px以下でも役割が分かるsilhouetteへ固定する。

外部referenceは模写用ではない。抽出するのは、mass比率、単純化、toy/plush感、secondary partの考え方だけ。

## Shared rules

- bodyはsoft / rounded。faceted detailはcrystalだけ。
- normal enemyの目は全高6–10%、hard cap 12%。
- brown/amber色だけで種差を作らない。
- 一体につき最大silhouette hookは一つ。
- realistic insect anatomy / realistic mole paws / realistic bat wings / humanoid golem / realistic turtle anatomyへ寄せない。
- friendly slimeよりsurface detailとVFX密度を抑える。

## ころクリ — Crystal Beetle

Saved reference:
- `images/area03-crystal-beetle-reference.png`

Source:
- Meshtint, Crystal Gem Bug Cute Series
  https://www.meshtint.com/products/crystal-gem-bug-cute-series
- supplemental concept reference image archived above

Extract:
- low insect bodyより背中のcrystal massを大きくする
- crystalは少数の大きいfacets
- ground-hugging silhouette

Do not copy:
- exact crystal cluster arrangement
- exact colors
- realistic multi-jointed legs
- glowing eyes

Production target:
> 丸い低い虫の背中に「一個の鉱石」が乗っている、と一目で読める。

## つるはしモグ — Drill-Nose Mole

Saved reference:
- `images/area03-mole-plush-reference.png`

Source:
- Treehouse Toys, Mole Mini
  https://treehousetoys.us/products/mole-11in

Extract:
- pear / egg-like compact body
- short paws
- tiny face
- muzzle / noseだけでmole identityが成立する

Do not copy:
- plush pattern
- colors
- paw markings
- realistic claws

Production target:
> 「つるはしを持つモグラ」ではなく、短い鉱石鼻そのものがdrill-like hookになる。

## きらコウモリ — Crystal Bat

Saved reference:
- `images/area03-bat-plush-reference.jpg`

Source:
- Plush Paws, KENJI
  https://www.plushpaws.co.uk/kenji.html

Extract:
- body/headを大きいcompact massとして保つ
- earsとfolded wingを小数の大形状にする
- wingを薄い膜の細密形状へしない

Do not copy:
- giant glossy eyes
- exact face
- exact palette
- clothing/accessory detail

Production target:
> 幅広い丸翼 + 小さい結晶accent。wingを閉じた時でもbatと読める。

## ゴロゴーレム — Pebble Golem

Saved reference:
- `images/area03-golem-reference.png`

Source:
- 3S Avatar Studio, Mini Golem Avatar
  https://booth.pm/ja/items/6933086

Extract:
- chunky rock mass
- detached / separated masses can still read as one character
- rounded low-poly facet language

Do not copy:
- humanoid torso/limb layout
- rune graphics
- glowing giant eyes
- detailed cracks

Production target:
> 頭・胴・腕脚の人型ではなく、「三個の丸石が寄り集まった生き物」。

## 琥珀ガメ — Amber Turtle

Source:
- Jellycat, Bashful Turtle
  https://us.jellycat.com/bashful-turtle/
- Jellycat, Tumbletuft Turtle
  https://jellycat.com/tumbletuft-turtle/

Extract:
- shell is the dominant rear mass
- head and limbs are short / chunky
- soft low stance
- face remains small relative to shell

Do not copy:
- shell stitching/pattern
- exact proportions
- exact palette
- realistic scute pattern

Production target:
> 巨大な一枚琥珀shellが先に見え、その下から小さい頭と足が出る。通常敵のscale-upではない。

## Motion-reference consequences

ころクリ:
- body stops first -> crystal overshoots 0.05–0.12s -> settle

モグ:
- body visibly sinks before translation
- pop release is faster than dive
- nose stays attached to head mass; no tool-swing motion

コウモリ:
- wings close before shot
- release -> one recoil beat -> wing settle
- projectile is one clean ring, not particle spray

ゴーレム:
- three masses move slightly inward before tackle
- hit briefly separates masses
- defeat settles into a pile; no exploding pieces

琥珀ガメ:
- head/feet retract
- still hold
- fast roll
- shell wobble after stop
- defeat keeps shell intact
