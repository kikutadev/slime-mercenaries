# Slime Mercenaries — Product Concept

Status: Current product concept
Date: 2026-09-16

## 1. Product statement

『スライム傭兵団』は、何もできないスライムへ武器を渡して職業を生み、同種を合成して強くし、少数精鋭の主力と各地へ働きに出る控えを育てる、スマートフォン縦画面向けのバトル系放置RPGである。

> **一匹の何もできないスライムに剣を渡した。その一匹が強くなり、仲間の職業が増え、いつの間にか各地で仕事を請け負う傭兵団になっている。**

成長は数値表だけで完結させない。武器、装飾、攻撃回数、projectile、軌跡、VFX、skill挙動として戦闘へ戻す。ただし、合成ランクによってスライム本体を大きくしない。

## 2. Highest-order experience

プレイヤーに継続して抱かせたい欲求は次の4つ。

1. **素材から新しいPlain Slimeを生み、次はどんな職業へ変えられるのか見たい**
2. **発見済み職をもう一度作り、次の合成段階へ進めたい**
3. **強化した結果、戦い方がもっと気持ちよく変わるところを見たい**
4. **主力以外にも仕事を任せ、傭兵団全体が働いている状態を作りたい**

機能追加は、このいずれかを強める場合に優先する。

## 3. Core loop

```text
自動戦闘
  ↓
敵撃破 / 宝箱 / 派遣
  ↓
Gold・スライム生成素材・Job Gear・装備・合成素材を獲得
  ↓
Plain Slimeを生成またはショップ購入
  ↓
Plain + Job Gearで職業発見 / 発見済み職ならFusion Input化
  ↓
同種合成 / Promotion / 装備更新
  ↓
攻撃方法・テンポ・VFXが変化
  ↓
主力をより強い敵へ / 控えを派遣へ
  ↓
戦闘・派遣の報酬でさらに発見と強化
```

報酬画面だけが面白い状態にはしない。強化の結果は必ずメイン戦闘の見た目または行動へ戻す。

## 4. What makes this game distinct

### 4.1 Slime remains slime

職業が上がっても人型キャラクターへ変身させない。

大きな丸い体、ぷるぷるした移動、大きな目というスライムのidentityを保ったまま、剣・盾・帽子・杖・銃・頭巾などの装備とアニメーションで職業を読ませる。

### 4.2 Fusion strengthens a type; it does not create an army

同じ職業スライムを再生成した価値は、戦場へ同型を何匹も追加することではなく、**その種類を合成して強くすること**に置く。通常職スライムは原則として宝箱から完成体を直接引くのではなく、Plain Slimeを素体にJob Gearを与えて作る。

- Plain Slimeは素材から生成するか、Goldでショップ購入できる
- Plain Slimeの在庫は個体育成を持たない素体stockとして扱う
- 未発見職を作るとcanonical roster entryが解放される
- 発見済み職をもう一度作るとtype-specific Slime Core / fusion inputになる
- メイン戦闘では一つの種類につき原則1匹を表示する
- 合成ランクが上がってもbody sizeは変えない
- 強さは武器、装飾、attack pattern、projectile、trail、impact、skillなどで見せる

「何匹いるか」ではなく「この一匹がどこまで育ったか」を気持ちよさの中心にする。

### 4.3 Plain Slime is the renewable body source

通常職の供給起点はPlain Slimeへ統一する。

- 戦闘・派遣から得る素材でPlain Slimeを生成できる
- Goldを使うショップ購入は、素材RNGによる進行停止を防ぐdeterministic backstopである
- Plain Slime stock自体にはlevel、equipment、個体値、assignmentを持たせない
- Plain Slimeを戦闘種として所有するcanonical roster stateと、職業化に消費するPlain Slime stockは別概念とする
- 通常Jobは `Plain Slime + Job Gear` から発見する

これにより「スライムを作り、仕事を与え、育てる」という一貫した傭兵団形成fantasyを保つ。

### 4.4 Small party, readable characters

メイン戦闘は最大6枠、各枠1匹とする。

プレイヤーは少数の種類を選ぶだけでよく、一匹ごとの表情、HP、攻撃、被弾、敗北がスマートフォン上で読める。30匹を常時表示する軍勢表現はcore goalにしない。

### 4.5 Reserve slimes still have a job

発見・育成した別種類がメイン編成から外れても無価値にしない。

メイン編成外のスライムは、護衛、探索、採集などの派遣へ出せる。派遣は「余った同種の頭数を消費する」仕組みではなく、**控えの種類に別の仕事を与える仕組み**である。

### 4.6 Loot changes behavior, not only numbers

装備は攻撃力+5%だけで終わらせない。

高rarityほど、弾数、射程、貫通、範囲、追加hit、projectile形状、skill演出など、見て分かる差を持たせる。

### 4.7 Surprise without progression dead-ends

発見済み職の再生成、高rarity equipment、mutationは驚きを作る。一方、通常職の発見や通常進行を極端な低確率だけに拘束しない。core branchにはdeterministicな到達手段を持つ。

## 5. Combat fantasy

固定カメラの3/4見下ろし戦場を、味方は画面下側から上側へ進軍する。

- Swordは敵へ踏み込んで斬る
- Shieldは前で攻撃を受ける
- Bowは距離を取って射る
- Wandは範囲魔法を撃つ
- Daggerは素早く飛び込む
- Gunは反動のある射撃を行う

職業差は複雑なAIより、**動きと攻撃の見た目で即座に分かること**を優先する。

敵wave撃破後は短く前進し、背景がscrollして次の群れへ繋がる。画面遷移を挟まず「遠征が進み続けている」感覚を出す。

## 6. Fusion fantasy

Fusionは単なるstat合算ではなく、同じお気に入りを継続して育てる主要報酬である。

Fusion rankの上昇で許される変化:

- base stat上昇
- 武器の見た目・質感・小さな装飾の強化
- attack count / hit patternの変化
- projectile / slash trail / impactの強化
- signature behaviorの段階的解放

Fusion rankの上昇で行わない変化:

- slime bodyの恒常的な大型化
- humanoid化
- 同型bodyを戦場に追加すること

同じ画面サイズのまま、「明らかに前より強い一匹」に見えることを狙う。

## 7. Dispatch fantasy

傭兵団らしさは、メイン戦闘を大軍団にするのではなく、複数の仕事を同時に回している状態で表現する。

派遣は簡潔にする。

```text
護衛依頼 -> Gold寄り
探索依頼 -> 装備 / Key寄り
採集依頼 -> 進化素材寄り
```

- メイン編成中の種類は同時に派遣できない
- 派遣中の種類は帰還までメイン編成へ入れられない
- 失敗率、疲労、属性適性の細かい表は初期coreにしない
- 帰還時にスライムが報酬を持ち帰る短い演出を入れる

派遣は管理ゲーム化するためではなく、控えにも意味を持たせ、放置報酬に世界観を与えるために存在する。

## 8. Reward rhythm

目標cadenceは以下。

- 2〜5秒: hit、撃破、coin、被弾、ぷるぷるした反応
- 15〜40秒: 宝箱またはmeaningful dropへの期待
- 1〜3分: level、fusion、equipment、job discoveryのいずれか
- 5〜10分: 新職、進化、boss、新地域、派遣先解放など大きな変化

毎回modalを出して手を止めない。battlefield上の小rewardは流し、重大なNEWだけ演出を強くする。

## 9. First 10 minutes

### 0:00–1:00

- 最初の生成素材からPlain Slime 1匹を確定生成する
- 敵は小型キノコ
- 最初の木箱からSword Job Gearを確定
- Job Gearを渡すとSword Slimeへ変化
- ショップでもPlain SlimeをGold購入できることを早期に見せる

### 1:00–3:00

- 2体目のPlain Slimeを生成または購入し、Sword Job GearでSword Slimeを再生成する
- 再生成したSword SlimeはSword Slime Coreへ変換され、最初のfusion素材になる
- 体の大きさは変わらず、攻撃モーション・範囲・演出が一段上がる
- Bow Job Gearを確定入手し、別のPlain SlimeからBow Slimeを発見

### 3:00–5:00

- 3体目の職業を発見
- 初のSilver Chest
- equipment rarity差を体験
- 初boss「オオキノコ」

### 5:00–8:00

- メイン編成に入れていない種類で最初の派遣を開始
- 進化または次fusion段階の到達を見せる
- Codexで未発見silhouetteを見せる

### 8:00–10:00

- 次地域「Mushroom Forest」へ到達
- specializationの存在を予告
- 主力3〜4匹 + 派遣中1〜2種類程度の状態へ到達

ここまでに「数字が増えるだけ」でなく、「武器で職業が生まれ、同種合成で一匹が強くなり、控えも仕事へ出せるゲーム」であることを理解させる。

## 10. Tone and world

世界観は明るいfantasy。重い設定説明は行わない。

導入は次だけで十分とする。

> 何もできないスライムに、試しに剣を渡した。  
> その日、世界で最初のスライム傭兵が生まれた。

プレイヤーは傭兵団の団長。言葉を話さないスライムたちの反応と戦い方から性格を感じる。

## 11. Non-goals

少なくとも初期productでは以下をcoreにしない。

- 20〜30匹をメイン戦闘へ常時表示するarmy simulation
- 同種の頭数を増やすpopulation growth
- Named heroの人格ドラマ
- 個体IV・ランダムstat厳選
- 個体ごとの多数equipment slot
- PvP
- guild/social
- 手動移動操作
- 大量のactive skillボタン
- 複雑な派遣成功率・疲労・適性表
- キャラクターガチャを引かないと通常職が成立しない構造

## 12. Product acceptance

初見プレイヤーが10分以内に、説明文なしでも概ね次の一文を理解できること。

> 「敵を倒して素材や装備を集め、Plain Slimeを作って仕事道具を渡すと新しい職業が生まれる。同じ職業をもう一度作れば合成で一匹を強くでき、主力以外は派遣へ出せるゲーム。」
