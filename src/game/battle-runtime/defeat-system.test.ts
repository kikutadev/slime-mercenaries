import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import type { MorphMesh } from '../slime-motion';
import type { AllyUnit, EnemyUnit, HealthBarGroup } from './types';
import {
  beginAllyDefeat,
  beginEnemyDefeat,
  resetAllyForEncounter,
  updateAllyDefeat,
} from './defeat-system';

function allyFixture(): AllyUnit {
  const root = new THREE.Group();
  root.position.set(2, 0.4, 3);
  root.visible = true;

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(),
    new THREE.MeshBasicMaterial(),
  ) as MorphMesh;
  body.morphTargetDictionary = { Squash: 0 };
  body.morphTargetInfluences = [0.8];
  const faceRoot = new THREE.Group();
  root.add(body, faceRoot);

  const equipmentAnchor = new THREE.Group();
  root.add(equipmentAnchor);

  const normalEye = new THREE.Group();
  const xEye = new THREE.Group();
  xEye.visible = false;
  xEye.userData.defeatEyeBasePosition = new THREE.Vector3(0.1, 0.2, 0.3);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(1),
    new THREE.MeshBasicMaterial({ opacity: 0.1, transparent: true }),
  );
  shadow.visible = false;
  const healthBar = new THREE.Group() as HealthBarGroup;
  healthBar.visible = false;

  return {
    id: 'ally-test',
    slimeId: 'slime-1',
    slotIndex: 0,
    side: 'ally',
    behaviorId: 'sword-melee',
    fusionRank: 1,
    root,
    body,
    faceRoot,
    equipmentAnchor,
    secondaryEquipmentAnchor: null,
    mageRuneAnchor: null,
    guardPulseVfx: null,
    mageCastSigil: null,
    rogueSlashArc: null,
    signatureVfx: null,
    auxiliaryRoot: null,
    auxiliaryMuzzle: null,
    auxiliaryBasePosition: new THREE.Vector3(),
    auxiliaryBaseQuaternion: new THREE.Quaternion(),
    auxiliaryBaseScale: new THREE.Vector3(1, 1, 1),
    weaponTip: null,
    projectileOrigin: null,
    spellOrigin: null,
    equipmentBaseQuaternion: equipmentAnchor.quaternion.clone(),
    equipmentBasePosition: equipmentAnchor.position.clone(),
    secondaryEquipmentBaseQuaternion: new THREE.Quaternion(),
    secondaryEquipmentBasePosition: new THREE.Vector3(),
    mageRuneBaseQuaternion: new THREE.Quaternion(),
    mageRuneBaseScale: new THREE.Vector3(1, 1, 1),
    bodyBaseScale: new THREE.Vector3(1, 1, 1),
    faceBasePosition: new THREE.Vector3(0, 0.1, 0),
    shadow,
    healthBar,
    home: new THREE.Vector3(-1, 0.02, 0.5),
    combatAnchor: new THREE.Vector3(),
    approachOrigin: new THREE.Vector3(),
    resultOrigin: new THREE.Vector3(),
    maxHp: 100,
    hp: 0,
    alive: true,
    state: 'idle',
    defeatStartedAt: -Infinity,
    hitStartedAt: 5,
    nextAttackAt: 9,
    attackStartedAt: 3,
    attackTarget: null,
    hitsApplied: 2,
    shotApplied: true,
    normalEyes: [normalEye],
    xEyes: [xEye],
    damageTakenEffect: null,
  };
}

describe('battle defeat lifecycle', () => {
  it('starts ally defeat once and switches from normal eyes to x eyes', () => {
    const ally = allyFixture();
    const playSound = vi.fn();

    beginAllyDefeat(ally, 12.5, playSound);

    expect(ally.alive).toBe(false);
    expect(ally.state).toBe('defeat');
    expect(ally.defeatStartedAt).toBe(12.5);
    expect(ally.normalEyes[0]?.visible).toBe(false);
    expect(ally.xEyes[0]?.visible).toBe(true);
    expect(playSound).toHaveBeenCalledOnce();

    beginAllyDefeat(ally, 20, playSound);
    expect(playSound).toHaveBeenCalledOnce();
    expect(ally.defeatStartedAt).toBe(12.5);
  });

  it('finishes ally defeat visually and restores a clean encounter state', () => {
    const ally = allyFixture();
    beginAllyDefeat(ally, 0, () => undefined);

    updateAllyDefeat(ally, 99);
    expect(ally.state).toBe('dead');

    resetAllyForEncounter(ally);

    expect(ally.hp).toBe(ally.maxHp);
    expect(ally.alive).toBe(true);
    expect(ally.state).toBe('idle');
    expect(ally.root.position.toArray()).toEqual(ally.home.toArray());
    expect(ally.body.scale.toArray()).toEqual(ally.bodyBaseScale.toArray());
    expect(ally.body.morphTargetInfluences).toEqual([0]);
    expect(ally.normalEyes[0]?.visible).toBe(true);
    expect(ally.xEyes[0]?.visible).toBe(false);
    expect(ally.shadow.visible).toBe(true);
    expect(ally.shadow.material.opacity).toBeCloseTo(0.22);
    expect(ally.healthBar.visible).toBe(true);
  });

  it('starts enemy defeat by freezing attack state and hiding its telegraph', () => {
    const root = new THREE.Group();
    root.position.set(3, 0, 4);
    const telegraph = new THREE.Mesh(
      new THREE.RingGeometry(0.5, 1),
      new THREE.MeshBasicMaterial(),
    );
    telegraph.visible = true;
    const normalEye = new THREE.Group();
    const xEye = new THREE.Group();
    xEye.visible = false;
    const enemy = {
      alive: true,
      state: 'idle',
      defeatStartedAt: -Infinity,
      attackOrigin: new THREE.Vector3(),
      root,
      attackStartedAt: 5,
      attackTarget: {} as AllyUnit,
      attackTelegraph: telegraph,
      normalEyes: [normalEye],
      xEyes: [xEye],
    } as unknown as EnemyUnit;
    const playSound = vi.fn();

    beginEnemyDefeat(enemy, 7, playSound);

    expect(enemy.alive).toBe(false);
    expect(enemy.state).toBe('defeat');
    expect(enemy.attackOrigin.toArray()).toEqual([3, 0, 4]);
    expect(enemy.attackStartedAt).toBe(-Infinity);
    expect(enemy.attackTarget).toBeNull();
    expect(telegraph.visible).toBe(false);
    expect(normalEye.visible).toBe(false);
    expect(xEye.visible).toBe(true);
    expect(playSound).toHaveBeenCalledWith('enemy-defeat');
  });
});
