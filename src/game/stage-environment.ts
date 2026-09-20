export {
  ENVIRONMENT_AREA_IDS,
  getEnvironmentAreaMetadata,
  getStageEnvironmentDefinition,
  isEnvironmentAreaId,
  placementIntrudesCombatClearZone,
  type EnvironmentAreaId,
  type EnvironmentLayer,
  type EnvironmentPlacement,
  type StageEnvironmentDefinition,
} from './environments/catalog';

export {
  createStageEnvironment,
  resolveStageSceneryZ,
  type StageEnvironmentRuntime,
} from './environments/runtime';
