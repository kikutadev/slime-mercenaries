import type { TimedActivityDefinition } from 'idle-game-kit';
import { balance } from './balance';
import { ids } from './definition-ids';

export type DispatchContractId = keyof typeof dispatchContractDefinitions;

export type DispatchContractDefinition = Readonly<{
  id: string;
  displayName: string;
  requiredPower: number;
  activity: TimedActivityDefinition;
}>;

export const dispatchContractDefinitions = {
  roadEscort: {
    id: ids.activity.roadEscort,
    displayName: '街道護衛',
    requiredPower: balance.dispatch.roadEscort.requiredPower,
    activity: {
      id: ids.activity.roadEscort,
      mode: 'timed',
      durationSec: balance.dispatch.roadEscort.durationSec,
      completionRewards: [{
        type: 'currency',
        currencyId: ids.currency.gold,
        amount: balance.dispatch.roadEscort.goldReward,
        source: ids.activity.roadEscort,
      }],
      claimPolicy: 'auto',
      repeatPolicy: 'repeatable',
      offlinePolicy: 'progress',
    },
  },
  forestExploration: {
    id: ids.activity.forestExploration,
    displayName: '森林探索',
    requiredPower: balance.dispatch.forestExploration.requiredPower,
    activity: {
      id: ids.activity.forestExploration,
      mode: 'timed',
      durationSec: balance.dispatch.forestExploration.durationSec,
      completionRewards: [{ type: 'token', tokenId: ids.token.forgeKey, count: balance.dispatch.forestExploration.forgeKeyReward }],
      claimPolicy: 'auto',
      repeatPolicy: 'repeatable',
      offlinePolicy: 'progress',
    },
  },
  materialGathering: {
    id: ids.activity.materialGathering,
    displayName: '素材採集',
    requiredPower: balance.dispatch.materialGathering.requiredPower,
    activity: {
      id: ids.activity.materialGathering,
      mode: 'timed',
      durationSec: balance.dispatch.materialGathering.durationSec,
      completionRewards: [{ type: 'token', tokenId: ids.token.hardeningGel, count: balance.dispatch.materialGathering.hardeningGelReward }],
      claimPolicy: 'auto',
      repeatPolicy: 'repeatable',
      offlinePolicy: 'progress',
    },
  },
} as const satisfies Readonly<Record<string, DispatchContractDefinition>>;
