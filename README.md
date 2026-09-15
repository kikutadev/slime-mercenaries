# Slime Mercenaries / スライム傭兵団

かわいいスライムの職業進化・部隊編成・装備収集を軸にした、スマートフォン縦画面向けのバトル系放置RPG。

本作は `idle-game-kit` を利用する独立ゲームリポジトリとして管理する。

## Product statement

> 最弱のスライムを集め、装備を与えて職業へ進化させ、画面いっぱいの小さな傭兵団を育てる放置バトルRPG。

プレイヤーが管理するのは大量の個体パラメータではなく、発見した「スライム種」とその部隊。6つの編成枠から複数体ずつが戦場へ出撃し、最終的には20〜30体程度のスライムが自動で移動・攻撃する。

キャラクターガチャを中心にせず、戦闘・宝箱・装備・進化が一つの循環につながる構造を採用する。

## Documentation

- [`docs/README.md`](docs/README.md) — 文書の正本案内
- [`docs/CONCEPT.md`](docs/CONCEPT.md) — 商品コンセプトと体験原則
- [`docs/SPEC.md`](docs/SPEC.md) — 現在仕様のトップレベル正本
- [`docs/specs/evolution-roster.md`](docs/specs/evolution-roster.md) — 30種の進化・役割・発見条件
- [`docs/specs/combat.md`](docs/specs/combat.md) — 自動戦闘、編成、Jelly Rush
- [`docs/specs/progression-economy.md`](docs/specs/progression-economy.md) — 宝箱、装備抽選、成長、エリア
- [`docs/specs/ux-ui.md`](docs/specs/ux-ui.md) — 画面構成と主要導線
- [`docs/specs/art-direction.md`](docs/specs/art-direction.md) — キャラクター、背景、VFX、アセット方針

## Runtime prototype

Plain Slimeから一段進め、Sword Slimeの戦闘PoCを実装済み。Blender Pythonを正本としてGLBを生成し、WebランタイムではMorph Targetを使ったSquash / Stretch / Lean / Hitに加えて、重力ベースのHop、体当たり、剣の遅れ追従を伴うSlashを合成する。

- GitHub Pages: https://kikutadev.github.io/slime-mercenaries/
- `npm run generate:model` — Blender 4.5 LTSで `public/assets/sword-slime.glb` を再生成
- `npm run dev` — ローカル実行
- `npm run build` — GitHub Pages向け静的ビルド

## Current phase

Product specification / pre-production から、アートパイプラインとruntime vertical sliceの検証へ移行中。現在は実戦サイズへ縮小したSword Slimeで、重力感、接地、Tackle、Slash、装備追従を検証している。
