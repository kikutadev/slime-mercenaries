# Documentation Authority

Status: Current
Date: 2026-09-16

このリポジトリでは、現在仕様と設計意図を以下へ分離する。履歴はGitに置き、完了済みplanやreviewを恒久文書として蓄積しない。

## Current authority

| Document | Owns |
|---|---|
| [`CONCEPT.md`](CONCEPT.md) | 誰に何を感じさせるゲームか、core fun、設計優先順位 |
| [`SPEC.md`](SPEC.md) | ゲーム全体の現在仕様、主要state、各specへの境界 |
| [`specs/evolution-roster.md`](specs/evolution-roster.md) | スライム種、職業進化、同種合成、roster state |
| [`specs/combat.md`](specs/combat.md) | 小編成、battlefield、auto combat、勝敗 |
| [`specs/progression-economy.md`](specs/progression-economy.md) | Plain生成/ショップ、stage、宝箱、装備、抽選、派遣、offline、長期成長 |
| [`specs/kit-integration.md`](specs/kit-integration.md) | idle-game-kitとのstate/API境界、共通化/ゲーム固有の責務分離 |
| [`specs/ux-ui.md`](specs/ux-ui.md) | mobile portrait UI、navigation、主要interaction |
| [`specs/art-direction.md`](specs/art-direction.md) | visual identity、body-size invariant、animation、VFX、environment |
| [`specs/enemies/README.md`](specs/enemies/README.md) | Area 1以降の敵roster、シルエット、モーション、ステージ導入順 |
| [`adr/0002-small-party-fusion-and-dispatch.md`](adr/0002-small-party-fusion-and-dispatch.md) | 大人数部隊をやめ、少数編成・同種合成・控え派遣へ移行した理由 |
| [`adr/0003-plain-slime-supply-and-job-creation.md`](adr/0003-plain-slime-supply-and-job-creation.md) | Plain Slimeを素材生成/Gold購入し、Job Gearで通常職を作る取得モデルの理由 |

[`adr/0001-type-squad-and-equipment-led-acquisition.md`](adr/0001-type-squad-and-equipment-led-acquisition.md) は superseded。旧type-squad案の rationale を履歴として保持する。

## Rule

- 数値調整の履歴は仕様に残さない。現在値だけを正本へ置く。
- 実装時に一時planが必要なら `docs/plans/YYYY-MM-DD-<topic>.md` を作り、完了後に現在仕様へ必要事項を昇格してplan自体は削除する。
- 戦闘feelやUI polishは実画面・実速度で確認する。仕様文だけをacceptance evidenceとしない。
