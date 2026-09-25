import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useGameController } from '../../app/GameProvider';
import {
  canStartQueuedBattleScene,
  enqueueBattleSceneModel,
} from '../../application/battle-presentation';
import type { BattleSceneModel } from '../../application/selectors/battle-scene';
import {
  currentCombatEncounterIdentity,
} from '../../domain';
import type { BattleSnapshot } from '../../game/BattleRuntime';
import { didBattleStageAdvance } from './battle-screen-view';

export const INITIAL_BATTLE_SNAPSHOT: BattleSnapshot = {
  phase: 'loading',
  label: '出撃準備中',
  result: null,
  enemyAlive: 0,
  presentationReady: false,
  enemies: {},
  allies: {},
};

export function useBattlePresentation(authoritativeSceneModel: BattleSceneModel) {
  const controller = useGameController();
  const [sceneModel, setSceneModel] = useState(authoritativeSceneModel);
  const [pendingSceneModel, setPendingSceneModel] = useState<BattleSceneModel | null>(null);
  const [queuedSceneModels, setQueuedSceneModels] = useState<readonly BattleSceneModel[]>([]);
  const [battle, setBattle] = useState<BattleSnapshot>(INITIAL_BATTLE_SNAPSHOT);
  const [stageArrival, setStageArrival] = useState<string | null>(null);
  const [restartRevision, setRestartRevision] = useState(0);

  const presentedSceneModelRef = useRef(sceneModel);
  const pendingSceneModelRef = useRef<BattleSceneModel | null>(pendingSceneModel);
  const queuedSceneModelsRef = useRef<readonly BattleSceneModel[]>(queuedSceneModels);
  const previousStageRef = useRef({
    areaId: sceneModel.areaId,
    stageNumber: sceneModel.stageNumber,
  });
  const reportedResultKeysRef = useRef(new Set<string>());

  presentedSceneModelRef.current = sceneModel;
  pendingSceneModelRef.current = pendingSceneModel;
  queuedSceneModelsRef.current = queuedSceneModels;

  useLayoutEffect(() => {
    controller.setLiveBattleActive(true);
    return () => controller.setLiveBattleActive(false);
  }, [controller]);

  useEffect(() => {
    const incoming = authoritativeSceneModel;
    const presented = presentedSceneModelRef.current;
    const pending = pendingSceneModelRef.current;

    if (incoming.encounterKey === presented.encounterKey) {
      if (incoming.visualKey !== presented.visualKey) {
        presentedSceneModelRef.current = incoming;
        setSceneModel(incoming);
      }
      return;
    }

    if (pending !== null && incoming.encounterKey === pending.encounterKey) {
      if (incoming.visualKey !== pending.visualKey) {
        pendingSceneModelRef.current = incoming;
        setPendingSceneModel(incoming);
      }
      return;
    }

    const nextQueue = enqueueBattleSceneModel(
      presented,
      pending,
      queuedSceneModelsRef.current,
      incoming,
    );
    if (nextQueue === queuedSceneModelsRef.current) return;
    queuedSceneModelsRef.current = nextQueue;
    setQueuedSceneModels(nextQueue);
  }, [
    authoritativeSceneModel.encounterKey,
    authoritativeSceneModel.visualKey,
    authoritativeSceneModel.encounter,
  ]);

  useEffect(() => {
    const pending = pendingSceneModelRef.current;
    const queue = queuedSceneModelsRef.current;
    if (!canStartQueuedBattleScene(battle.presentationReady, pending, queue)) return;

    const [next, ...rest] = queue;
    if (next === undefined) return;

    queuedSceneModelsRef.current = rest;
    setQueuedSceneModels(rest);
    pendingSceneModelRef.current = next;
    setPendingSceneModel(next);
  }, [battle.presentationReady, pendingSceneModel, queuedSceneModels.length]);

  const handleSnapshot = useCallback((snapshot: BattleSnapshot) => {
    setBattle(snapshot);
    if (snapshot.result === null) return;

    const presented = presentedSceneModelRef.current;
    if (presented.encounter === null) return;
    const resultKey = `${presented.encounterKey}:${snapshot.result}`;
    if (reportedResultKeysRef.current.has(resultKey)) return;
    reportedResultKeysRef.current.add(resultKey);

    const identity = {
      areaId: presented.areaId,
      stageNumber: presented.stageNumber,
      waveIndex: presented.waveIndex,
      encounterId: presented.encounter.id,
    };
    const resolved = controller.resolveLiveBattleEncounter(identity, snapshot.result);
    if (!resolved.accepted || snapshot.result !== 'defeat') return;

    const nextIdentity = currentCombatEncounterIdentity(controller.store.getSnapshot());
    if (
      nextIdentity !== null
      && nextIdentity.areaId === identity.areaId
      && nextIdentity.stageNumber === identity.stageNumber
      && nextIdentity.waveIndex === identity.waveIndex
      && nextIdentity.encounterId === identity.encounterId
    ) {
      setRestartRevision((current) => current + 1);
    }
  }, [controller]);

  const handleEncounterReady = useCallback((readyModel: BattleSceneModel) => {
    const pending = pendingSceneModelRef.current;
    if (
      pending === null
      || pending.encounterKey !== readyModel.encounterKey
      || pending.visualKey !== readyModel.visualKey
    ) {
      return;
    }

    presentedSceneModelRef.current = readyModel;
    pendingSceneModelRef.current = null;
    setSceneModel(readyModel);
    setPendingSceneModel(null);
  }, []);

  const handleEncounterRestarted = useCallback((readyModel: BattleSceneModel) => {
    reportedResultKeysRef.current.delete(`${readyModel.encounterKey}:victory`);
    reportedResultKeysRef.current.delete(`${readyModel.encounterKey}:defeat`);
  }, []);

  useEffect(() => {
    const previous = previousStageRef.current;
    previousStageRef.current = {
      areaId: sceneModel.areaId,
      stageNumber: sceneModel.stageNumber,
    };
    if (!didBattleStageAdvance(previous, sceneModel)) return;
    setStageArrival(`${sceneModel.areaId}:${sceneModel.stageNumber}`);
  }, [sceneModel.areaId, sceneModel.stageNumber]);

  const clearStageArrival = (arrivalKey: string) => {
    setStageArrival((current) => current === arrivalKey ? null : current);
  };

  return {
    controller,
    sceneModel,
    pendingSceneModel,
    battle,
    stageArrival,
    restartRevision,
    handleSnapshot,
    handleEncounterReady,
    handleEncounterRestarted,
    clearStageArrival,
  };
}
