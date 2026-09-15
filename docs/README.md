# Documentation Authority

Status: Current
Date: 2026-09-15

このリポジトリでは、現在仕様と設計意図を以下へ分離する。履歴はGitに置き、完了済みplanやreviewを恒久文書として蓄積しない。

## Current authority

| Document | Owns |
|---|---|
| [`CONCEPT.md`](CONCEPT.md) | 誰に何を感じさせるゲームか、core fun、設計優先順位 |
| [`SPEC.md`](SPEC.md) | ゲーム全体の現在仕様、主要state、各specへの境界 |
| [`specs/evolution-roster.md`](specs/evolution-roster.md) | 30種のスライム、進化条件、role、mutation |
| [`specs/combat.md`](specs/combat.md) | 編成、battlefield、auto combat、skill、勝敗 |
| [`specs/progression-economy.md`](specs/progression-economy.md) | stage、宝箱、装備、抽選、通貨、offline、長期成長 |
| [`specs/ux-ui.md`](specs/ux-ui.md) | mobile portrait UI、navigation、主要interaction |
| [`specs/art-direction.md`](specs/art-direction.md) | visual identity、sprite、animation、VFX、environment |
| [`adr/0001-type-squad-and-equipment-led-acquisition.md`](adr/0001-type-squad-and-equipment-led-acquisition.md) | 個体hero収集ではなくtype squad + equipment収集を採る理由 |

## Rule

- 数値調整の履歴は仕様に残さない。現在値だけを正本へ置く。
- 実装時に一時planが必要なら `docs/plans/YYYY-MM-DD-<topic>.md` を作り、完了後に現在仕様へ必要事項を昇格してplan自体は削除する。
- 戦闘feelやUI polishは実画面・実速度で確認する。仕様文だけをacceptance evidenceとしない。
