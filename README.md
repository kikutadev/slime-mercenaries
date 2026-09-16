# Slime Mercenaries / スライム傭兵団

かわいいスライムの職業進化・同種合成・装備収集・派遣を軸にした、スマートフォン縦画面向けのバトル系放置RPG。

本作は `idle-game-kit` の公開package境界へ接続する独立ゲームリポジトリとして管理する。Currency / Token / Level / Gacha / Inventory / Loadout / Timed Activity / ProfileRepository / Simulator をauthoritative product Domainへ接続済みで、React/Three runtimeはその保存stateを読むpresentation層として動作する。接続境界は `docs/specs/kit-integration.md` を正本とする。

## Product statement

> 最弱のスライムに武器を渡して職業を生み、同種を合成して強くし、少数精鋭の主力と各地へ働きに出る控えを育てる放置バトルRPG。

プレイヤーが管理する中心は、個体ごとのランダム能力ではなく、発見した「スライム種」とその成長状態。メイン戦闘は最大6枠・各1匹の小編成とし、一匹ごとの武器、攻撃、被弾、敗北が読める密度を保つ。

通常職はPlain Slimeを素材生成またはGold購入し、Job Gearを与えて作る。発見済みの職業をもう一度作った場合は戦場の頭数を増やさず、その種類の合成素材へ変換する。メイン編成に入っていない育成済みの別種類は派遣へ回せるため、発見・育成したスライムが無駄になりにくい。

キャラクターガチャだけに依存せず、戦闘・宝箱・装備・職業発見・合成・派遣が一つの循環につながる構造を採用する。

## Documentation

- [`docs/README.md`](docs/README.md) — 文書の正本案内
- [`docs/CONCEPT.md`](docs/CONCEPT.md) — 商品コンセプトと体験原則
- [`docs/SPEC.md`](docs/SPEC.md) — 現在仕様のトップレベル正本
- [`docs/specs/evolution-roster.md`](docs/specs/evolution-roster.md) — スライム種、進化、合成、roster
- [`docs/specs/combat.md`](docs/specs/combat.md) — 小編成、自動戦闘、勝敗
- [`docs/specs/progression-economy.md`](docs/specs/progression-economy.md) — 宝箱、装備抽選、派遣、成長、エリア
- [`docs/specs/kit-integration.md`](docs/specs/kit-integration.md) — idle-game-kitとの接続境界と実装順序
- [`docs/specs/ux-ui.md`](docs/specs/ux-ui.md) — 画面構成と主要導線
- [`docs/specs/art-direction.md`](docs/specs/art-direction.md) — キャラクター、背景、VFX、アセット方針

## Runtime prototype

Sword Slime / Bow Slime の自動戦闘PoCを実装済み。Web runtimeは React + TypeScript + React Three Fiber。Blender Pythonを正本として職業別GLBを生成し、Morph Targetによる移動・攻撃・被弾表現、複数敵との相互攻撃、HP、敗北時の潰れ表現を動かしている。Slimes画面では同種合成の進捗・次のbehavior unlock・live 3D previewを実装し、Swordのfusion rankを実戦闘の連撃数へ反映する。

- GitHub Pages: https://kikutadev.github.io/slime-mercenaries/
- `npm run generate:model` — Blender 4.5 LTSで Sword / Bow の両GLBを再生成
- `npm run dev` — ローカル実行
- `npm run typecheck` — TypeScript static check
- `npm run build` — GitHub Pages向け静的ビルド

## Current phase

少数編成 + 同種合成 + 控え派遣を前提に、Plain生成/購入、職業作成、Level、Fusion、Promotion、Equipment Forge/Refinement/Loadout、Dispatch、Stage/Boss報酬、offline save、same-core simulatorまでauthoritative Domainへ接続済み。現在のSword/Bow vertical sliceを基準にバランスと戦闘feelを検証し、職業・地域・装備のコンテンツ量を順次拡張する。
