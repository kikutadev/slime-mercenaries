import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { SwordCombatFamily } from './ally-combat-sword';
import type { AllyUnit, EnemyUnit } from './types';

/** Construct only the authored sword motion anchors used during an ongoing slash. */
function makeSword(slotIndex: number, target: EnemyUnit): AllyUnit {
  const root = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.2), new THREE.MeshBasicMaterial());
  const equipmentAnchor = new THREE.Object3D();
  const weaponTip = new THREE.Object3D();
  equipmentAnchor.add(weaponTip);
  root.add(body, equipmentAnchor);
  root.position.x = slotIndex * 0.6;
  return {
    slotIndex,
    side: 'ally',
    alive: true,
    fusionRank: 0,
    root,
    body,
    bodyBaseScale: body.scale.clone(),
    faceRoot: null,
    equipmentAnchor,
    equipmentBaseQuaternion: equipmentAnchor.quaternion.clone(),
    equipmentBasePosition: equipmentAnchor.position.clone(),
    weaponTip,
    secondaryEquipmentAnchor: null,
    mageRuneAnchor: null,
    auxiliaryRoot: null,
    rogueSlashArc: null,
    guardPulseVfx: null,
    mageCastSigil: null,
    signatureVfx: null,
    shadow: new THREE.Mesh(new THREE.CircleGeometry(0.1), new THREE.MeshBasicMaterial()),
    combatAnchor: root.position.clone(),
    attackStartedAt: 0,
    nextAttackAt: 100,
    attackTarget: target,
    hitsApplied: 1,
  } as unknown as AllyUnit;
}

describe('simultaneous Sword Slime trails', () => {
  it('keeps two active slashes visible and resets only the owner on idle', () => {
    const added: THREE.Object3D[] = [];
    const target = {
      root: new THREE.Group(),
      alive: true,
    } as EnemyUnit;
    target.root.position.z = -1.3;
    const combat = new SwordCombatFamily({
      camera: new THREE.PerspectiveCamera(),
      effects: {} as never,
      addSceneObject: (object) => added.push(object),
      getLivingEnemies: () => [target],
      applyDamage: vi.fn(),
      startCameraShake: vi.fn(),
      startHitStop: vi.fn(),
    });
    combat.initializePresentationVfx();
    combat.initializePresentationVfx();
    expect(added).toHaveLength(12);
    expect(new Set(added).size).toBe(12);

    const first = makeSword(0, target);
    const second = makeSword(1, target);
    combat.updateSword(0.43, first);
    combat.updateSword(0.43, second);
    const firstArc = added[0]!;
    const secondArc = added[2]!;
    expect(firstArc.visible).toBe(true);
    expect(secondArc.visible).toBe(true);
    expect(firstArc).not.toBe(secondArc);

    second.attackStartedAt = -Infinity;
    second.attackTarget = null;
    combat.updateSword(0.50, second);
    expect(firstArc.visible).toBe(true);
    expect(secondArc.visible).toBe(false);

    combat.resetTransientVfx();
    expect(firstArc.visible).toBe(false);
    expect(added.every((object) => object.visible === false)).toBe(true);
  });
});
