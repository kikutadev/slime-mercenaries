# Slime Mercenaries — Product Concept

Status: Current product concept
Date: 2026-09-15

## 1. Product statement

『スライム傭兵団』は、最弱のスライムへ武器を渡し、職業へ進化させ、種類と部隊数を増やしながら巨大な敵へ挑む、スマートフォン縦画面向けのバトル系放置RPGである。

> **一匹の何もできないスライムが、いつの間にか画面いっぱいの多職種軍団になっている。**

この変化を、数値だけではなく戦場の密度・攻撃方法・シルエット・VFXとして常に見せる。

## 2. Highest-order experience

プレイヤーに継続して抱かせたい欲求は次の3つ。

1. **次はどんなスライムになるのか見たい**
2. **もう少し戦わせて次の宝箱を開けたい**
3. **自分の部隊がもっと大人数・派手になるところを見たい**

機能追加は、このいずれかを強める場合に優先する。

## 3. Core loop

```text
自動戦闘
  ↓
敵撃破 / 宝箱出現
  ↓
装備・進化素材・変異素材を獲得
  ↓
新職発見 / 装備更新 / 部隊強化
  ↓
戦場の人数・攻撃方法・VFXが変化
  ↓
より強い敵・新しい地域へ
  ↓
さらに未知のスライムと装備を発見
```

報酬画面だけが面白い状態にはしない。強化の結果は、必ずメイン戦闘の見た目と速度へ戻す。

## 4. What makes this game distinct

### 4.1 Slime remains slime

職業が上がっても人型キャラクターへ変身させない。

大きな丸い体、ぷるぷるした移動、大きな目というスライムのidentityを保ったまま、剣・盾・帽子・杖・銃・頭巾などの装備とアニメーションで職業を読ませる。

### 4.2 Type collection, not spreadsheet individuals

個体ごとの性格、IV、細かな装備欄、ランダムstat厳選をcoreにしない。

プレイヤーが扱う単位は「ソードスライム部隊」「メイジスライム部隊」のような**種別部隊**。同種を増やすほど部隊数と部隊levelが成長する。

### 4.3 Six decisions, many bodies

編成は6枠に制限し、管理負荷を小さくする。一方、各編成枠は戦闘中に複数体を展開するため、完成した戦場では20〜30体程度の味方スライムが同時に見える。

プレイヤーの判断数は少ないが、結果は大軍団として見せる。

### 4.4 Loot changes behavior, not only numbers

装備は攻撃力+5%だけで終わらせない。

高rarityほど、弾数、射程、貫通、範囲、追加hit、projectile形状、skill演出など、見て分かる差を持たせる。

### 4.5 Surprise without collection dead-ends

突然変異や高rarity dropは驚きを作る。一方、図鑑完成が低確率だけに拘束されないよう、mutation fragmentやpityによる確定到達手段を持つ。

## 5. Combat fantasy

固定カメラの3/4見下ろし戦場を、味方は画面下側から上側へ進軍する。

- 前衛は敵へ突撃する
- 盾役は味方より前へ出る
- 遠距離は安全距離を保つ
- 魔法は群れを焼く
- 狙撃は大型敵を抜く
- 銃・砲撃は派手なprojectileで戦場密度を上げる

敵wave撃破後は全員が短く前進し、背景がscrollして次の群れへ繋がる。画面遷移を挟まず「遠征が進み続けている」感覚を出す。

## 6. Reward rhythm

目標cadenceは以下。

- 2〜5秒: hit、撃破、coin、部隊の小さな反応
- 15〜30秒: 宝箱またはmeaningful dropへの期待
- 1〜3分: 装備更新、部隊level、進化material、new discoveryのいずれか
- 5〜10分: 新職、specialization、boss、新地域など大きな変化

毎回modalを出して手を止めない。battlefield上の小rewardは流し、重大なNEWだけ演出を強くする。

## 7. First 10 minutes

### 0:00–1:00

- Plain Slime 1体で開始
- 敵は小型キノコ
- 最初の木箱からRusty Swordを確定
- Swordを渡すとSword Slimeへ進化

### 1:00–3:00

- Plain Slime populationを追加獲得
- Bowを確定入手しBow Slimeを発見
- 2部隊で戦場が明確に賑やかになる

### 3:00–5:00

- 初のSilver Chest
- gear rarity差を体験
- 第3編成枠解放
- 初boss「オオキノコ」

### 5:00–8:00

- Tier 2進化を1つ解放
- Jelly Rushを初体験
- Codexで未発見silhouetteを見せる

### 8:00–10:00

- 次地域「Mushroom Forest」へ到達
- specializationの存在を予告
- 3〜4種、6〜10体程度のスライムが戦っている状態へ到達

ここまでに「放置して数字が増える」だけでなく、「装備で姿と戦い方が変わり、軍団が増えるゲーム」であることを理解させる。

## 8. Tone and world

世界観は明るいfantasy。重い設定説明は行わない。

導入は次だけで十分とする。

> 何もできないスライムに、試しに剣を渡した。  
> その日、世界で最初のスライム傭兵が生まれた。

プレイヤーは傭兵団の団長。言葉を話さないスライムたちの反応と戦い方から性格を感じる。

## 9. Non-goals

少なくとも初期productでは以下をcoreにしない。

- Named heroの人格ドラマ
- 個体厳選
- 装備slotを多数持つ複雑なinventory
- PvP
- guild/social
- 手動移動操作
- 大量のactive skillボタン
- キャラクターガチャを引かないと戦力が成立しない構造

## 10. Product acceptance

初見プレイヤーが10分以内に、説明文なしでも概ね次の一文を理解できること。

> 「敵を倒して装備を拾い、それをスライムに渡すと新しい職業になる。6部隊を育てるほど画面上のスライムが増えて、攻撃もどんどん派手になるゲーム。」
