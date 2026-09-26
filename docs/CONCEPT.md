# Slime Mercenaries — Product Concept

Status: Current product concept
Date: 2026-09-27

## 1. Product statement

『スライム傭兵団』は、何もできないPlain Slimeを生み、仕事道具を渡して職業を与え、最前線で負けながら素材を持ち帰り、Fusionで一匹ずつ戦い方を進化させていく、スマートフォン縦画面向けのバトル系放置RPGである。

> **何もできないスライムに仕事を与える。最前線で負けたら一つ戻って働き、強くなってまた挑む。気づけば主力も控えも各地で働く、自分だけのスライム傭兵団になっている。**

成長は数値表だけで完結させない。武器、装飾、攻撃回数、projectile、軌跡、VFX、signature behaviorとして必ず戦闘へ戻す。Fusion rankやlevelによってスライム本体を恒常的に大きくしない。

## 2. Highest-order experience

プレイヤーに継続して抱かせたい欲求は次の5つ。

1. **素材から新しいPlain Slimeを生み、次はどんな仕事を与えられるのか見たい**
2. **新しい職業を発見し、職業ごとに違う戦い方を見たい**
3. **最前線で負けても止まらず、ひとつ前で稼いで強くなり、もう一度突破したい**
4. **Fusionした結果、お気に入りの一匹の攻撃方法や演出がもっと気持ちよく変わるところを見たい**
5. **主力以外にも仕事を任せ、傭兵団全体が働いている状態を作りたい**

機能追加は、このいずれかを強める場合に優先する。

## 3. Core loop

```text
自動戦闘で最前線へ進む
  ↓
敵撃破 / 宝箱 / 派遣から報酬を得る
  ↓
Gold・Plain生成素材・Job Gear・装備・Fusion素材を獲得
  ↓
Plain Slimeを素材生成またはGold購入
  ↓
Plain Slime + Job Gearで職業を作る
  ↓
Level / Fusion / 装備更新で一匹を強くする
  ↓
攻撃方法・テンポ・projectile・VFX・signature behaviorが変化
  ↓
より強い最前線へ進む
  ↓
勝てなければ1 Stage撤退
  ↓
勝てるStageで自動farmしながら報酬を得る
  ↓
一定回数後に最前線へ自動再挑戦
  ↓
突破するまで「敗北 -> 撤退 -> farm -> retry」を繰り返す
```

敗北はGAME OVERではない。**成長cycleへの切り替わり**である。

報酬画面だけが面白い状態にはしない。強化の結果は必ずメイン戦闘の見た目または行動へ戻す。

## 4. What makes this game distinct

### 4.1 Give a slime a job

通常職の供給起点はPlain Slimeへ統一する。

- 戦闘・派遣から得る素材でPlain Slime stockを生成できる
- GoldショップでもPlain Slime stockを購入できる
- Plain Slime stock自体にはlevel、equipment、個体値、assignmentを持たせない
- 通常Jobは `Plain Slime stock + Job Gear` から作る
- 完成済み通常職をcharacter gachaから引かなければ進めない構造にはしない

この構造により、「スライムを生み、仕事を与え、育てる」という傭兵団形成fantasyを保つ。

### 4.2 Slime remains slime

職業が上がっても人型キャラクターへ変身させない。

大きな丸い体、ぷるぷるした移動、大きな目というスライムのidentityを保ったまま、剣・盾・帽子・杖・銃・頭巾などの装備とアニメーションで職業を読ませる。

強くなってもbody sizeは恒常的に増やさない。強さは武器、装飾、attack pattern、projectile、trail、impact、skillで見せる。

### 4.3 Defeat is progress, not a stop

最前線のpower checkはbossだけに限定しない。通常Stageでも勝てない壁を作れる。

敗北時は次を行う。

- GAME OVERを出さない
- `最高到達Stage`を保持したまま1 Stage撤退する
- Gold、宝箱、Plain生成素材、Job Gear、Fusion素材、Equipmentの獲得を止めない
- authored farm clear回数を満たしたら自動的に未突破frontierへ戻る
- 再敗北した場合も同じcycleを繰り返す
- offline中も勝てるStageでのfarmを継続する

「昨日勝てなかった敵を、育成後に突破する」ことを最も分かりやすい成長実感の一つにする。

### 4.4 Persistent individual slimes

職業スライムはpersistent instanceとして所有する。同じ職業を複数作っても自動mergeしない。

- 同職の別個体を複数所有できる
- 同職を複数のbattle slotへ同時編成できる
- 同職の別個体をbattle / reserve / dispatchへ分けられる
- Fusion素材が必要な場合だけ、eligibleなreserve個体を明示的にtype-specific Slime Coreへ変換する
- 最後の一匹、battle中、dispatch中の個体は消費しない

重複獲得を「ハズレ」にせず、**仲間として残すか、Fusionへ託すかをプレイヤーが選ぶ**。

### 4.5 Fusion is the form-growth system

通常の形態成長はFusionへ一本化する。Promotionという独立した通常進化軸は持たない。

```text
Rank 1: Tier-1 job
-> Rank 2: first family enhancement/form
-> Rank 3: Tier-2 job form
-> Rank 4: player-selected Tier-3 specialization
```

Fusion rankの上昇で許される変化:

- base stat上昇
- 武器の見た目・質感・小さな装飾の強化
- attack count / hit patternの変化
- projectile / slash trail / impactの強化
- signature behaviorの段階的解放

Fusion rankの上昇で行わない変化:

- slime bodyの恒常的な大型化
- humanoid化
- 同型bodyを同一slotへ追加すること

### 4.6 Small party, readable characters

メイン戦闘は最大6枠、各枠1匹とする。

プレイヤーは少数の個体を選び、一匹ごとの表情、HP、攻撃、被弾、敗北をスマートフォン上で読める。20〜30匹を常時表示するarmy simulationはcore goalにしない。

### 4.7 Reserve slimes still have a job

メイン編成から外れた個体も無価値にしない。

reserve個体は護衛、探索、採集などのDispatchへ出せる。Dispatchは「余った頭数を消費する」仕組みではなく、**控えの一匹にも別の仕事を与える仕組み**である。

### 4.8 Loot changes behavior, not only numbers

Equipmentは攻撃力+5%だけで終わらせない。

高rarityほど、弾数、射程、貫通、範囲、追加hit、projectile形状、skill演出など、見て分かる差を持たせる。

### 4.9 Surprise without progression dead-ends

高rarity equipment、mutation、rare chestは驚きを作る。一方、通常職の発見や通常進行を極端な低確率だけに拘束しない。core branchにはdeterministicな到達手段を持つ。

## 5. Combat fantasy

固定カメラの3/4見下ろし戦場を、味方は画面下側から上側へ進軍する。

- Swordは敵へ踏み込んで斬る
- Shieldは前で攻撃を受ける
- Bowは距離を取って射る
- Wandは範囲魔法を撃つ
- Daggerは素早く飛び込む
- Gunは反動のある射撃を行う

職業差は複雑なAIより、**動きと攻撃の見た目で即座に分かること**を優先する。

Every attack must read as:

`anticipation -> release -> travel/contact -> impact -> recovery`

敵wave撃破後は短く前進し、背景がscrollして次の群れへ繋がる。画面遷移を挟まず「遠征が進み続けている」感覚を出す。

敗北時は、スライムが短いrecoilの後に横へべちゃっと潰れ、目を`×`にする。violentではなく、かわいく少し情けない敗北にする。

## 6. Camp fantasy

Campは管理dashboardではない。**自分のスライムたちが暮らし、次の仕事へ向かう場所**である。

- 3D camp上のスライムは静止物にしない
- idle、周囲を見る、あくび、眠る、軽い移動など生活反応を持たせる
- routine actionは下部thumb zoneへ集約し、3D worldをボタンだらけにしない
- 強化、生成、職業化、Fusionには必ず短いcause-and-effect演出を入れる

プレイヤーがメニューを操作している感覚より、「キャンプに戻って仲間を育てている」感覚を優先する。

## 7. Dispatch fantasy

傭兵団らしさは、メイン戦闘を大軍団にするのではなく、複数の仕事を同時に回している状態で表現する。

```text
護衛依頼 -> Gold寄り
探索依頼 -> Equipment / Forge Key寄り
採集依頼 -> Fusion素材寄り
```

- battle中の個体は同時にdispatchできない
- dispatch中の個体は帰還までbattleへ入れられない
- 同職の別個体は独立してassignmentできる
- 失敗率、疲労、属性適性の細かい表は初期coreにしない
- 帰還時にスライムが報酬を持ち帰る短い演出を入れる

Dispatchは管理ゲーム化するためではなく、控えにも意味を持たせ、放置報酬に世界観を与えるために存在する。

## 8. Reward rhythm

目標cadenceは以下。

- 2〜5秒: hit、撃破、coin、被弾、ぷるぷるした反応
- 15〜40秒: 宝箱またはmeaningful dropへの期待
- 1〜3分: level、Fusion、Equipment、job discoveryのいずれか
- 5〜10分: 新職、specialization、boss、新地域、Dispatch先解放など大きな変化

毎回modalを出して手を止めない。battlefield上の小rewardは流し、重大なNEWだけ演出を強くする。

## 9. First 10 minutes

First-use teachingのcanonical detailsは [`specs/tutorial-onboarding.md`](specs/tutorial-onboarding.md) が所有する。この章はproduct cadenceだけを定義する。

### 0:00–1:30 — 生み出す / 仕事を与える

- 最初の素材でPlain Slime stockを確定生成する
- Plain Slimeが生成槽から現れ、短い身体反応と吹き出しで次の行動を示す
- 最初のSword Job Gearを確定で使える
- Plain Slimeへ剣を渡し、Sword Slimeを作る
- Sword Slimeを自動編成し、すぐ戦闘へ戻す

### 1:30–3:30 — 戦い方が変わる

- Swordの踏み込み斬りがPlainの弱い状態との差として読める
- Gold / chest / materialをbattlefield上で得る
- Level upを一度体験し、強化が戦闘へ戻ることを見せる
- Bow Job Gearへ到達し、2職目を発見する

### 3:30–6:00 — 同職を増やす / Fusionを理解する

- 2体目のSword Slimeを作る
- 2体目は自動mergeされず、独立した仲間として残る
- reserve個体をFusion Coreへ明示変換できることを示す
- 最初のSword Fusionを成立させ、body sizeを変えずGreatsword系の攻撃変化を見せる

### 6:00–8:00 — 負けて戻る

- authored frontierで最初の敗北を体験する
- `べちゃっ + ×目`を見せる
- GAME OVERを出さず、1 Stage撤退する
- farm中も報酬が続くことを見せる
- 成長後、自動で同じfrontierへ再挑戦する

### 8:00–10:00 — 傭兵団になる

- active formation外の個体で最初のDispatchを開始する
- 主力は戦闘、控えは別の仕事という役割分担を見せる
- 次のarea / specialization / Codex silhouetteを予告する

10分以内に「スライムを生み、仕事を与え、負けて稼ぎ、Fusionで一匹の戦い方を進化させ、控えも働かせるゲーム」であることを体験として理解させる。

## 10. Tone and world

世界観は明るいfantasy。重い設定説明は行わない。

導入は次だけで十分とする。

> 何もできないスライムに、試しに剣を渡した。  
> その日、世界で最初のスライム傭兵が生まれた。

スライムの可愛さは語尾や長い会話で作らない。**短い言葉、表情、間、ぷるぷるした身体反応**で作る。

Tutorialや短いreactionで吹き出しを使う場合も、キャラクター固有の語尾（例: 「〜ぷる」）は付けない。会話劇をcoreにせず、世界と操作への反応として最小限にする。

## 11. Non-goals

少なくとも初期productでは以下をcoreにしない。

- 20〜30匹をメイン戦闘へ常時表示するarmy simulation
- 同種の頭数を増やすこと自体を目的にしたpopulation growth
- Named heroの人格ドラマ
- 個体IV・ランダムstat厳選
- 個体ごとの多数equipment slot
- PromotionというFusionとは別の通常形態進化軸
- PvP
- guild/social
- 手動移動操作
- 大量のactive skillボタン
- 複雑なDispatch成功率・疲労・適性表
- キャラクターガチャを引かないと通常職が成立しない構造
- 長文modal tour

## 12. Product acceptance

初見プレイヤーが10分以内に、長い説明文を読まなくても概ね次を理解できること。

> 「素材からPlain Slimeを生み、仕事道具を渡すと職業が生まれる。戦い方を見ながら育て、勝てない場所では一つ戻って稼いでまた挑む。同じ職業の仲間は残すこともFusionへ使うこともでき、主力以外は別の仕事へ出せるゲーム。」

この理解が成立しない新規機能やUIは、core loopを増やす前に見直す。