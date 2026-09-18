export type BattleEnvironmentPresentation = Readonly<{
  asset: string;
  background: string;
  fog: string;
  fogNear: number;
  fogFar: number;
  cameraPosition: readonly [number, number, number];
  cameraLookAt: readonly [number, number, number];
}>;

const ENVIRONMENTS: Readonly<Record<string, BattleEnvironmentPresentation>> = {
  'area.clover-road': {
    asset: 'assets/environments/clover-road-battlefield.glb',
    background: '#b9e8f5',
    fog: '#cae8c5',
    fogNear: 8.5,
    fogFar: 21,
    cameraPosition: [2.35, 4.72, 7.72],
    cameraLookAt: [0, 0.42, -0.82],
  },
};

/** Resolve the authored environment used by the current playable area. */
export function getBattleEnvironmentPresentation(areaId: string): BattleEnvironmentPresentation {
  const environment = ENVIRONMENTS[areaId];
  if (environment === undefined) {
    throw new Error(`No battle environment presentation authored for ${areaId}`);
  }
  return environment;
}
