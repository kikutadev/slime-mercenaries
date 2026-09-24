import * as THREE from 'three';
import { clamp01 } from '../slime-motion';
import type { AllyUnit, BasicMaterial, BattleSnapshot, EnemyUnit, HealthBarGroup } from './types';

export function createShadow(radius = 0.3): THREE.Mesh<THREE.CircleGeometry, BasicMaterial> {
  const material = new THREE.MeshBasicMaterial({
    color: '#25462e',
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(radius, 32), material);
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(1.35, 0.68, 1);
  shadow.position.y = 0.011;
  return shadow;
}

export function createWorldHealthBar(side: 'ally' | 'enemy' = 'ally'): HealthBarGroup {
  const group = new THREE.Group() as HealthBarGroup;
  group.renderOrder = 8;
  const backMaterial = new THREE.MeshBasicMaterial({
    color: '#173348',
    transparent: true,
    opacity: 0.78,
    depthTest: false,
    depthWrite: false,
  });
  const fillMaterial = new THREE.MeshBasicMaterial({
    color: side === 'enemy' ? '#ff756d' : '#58d681',
    transparent: true,
    opacity: 0.96,
    depthTest: false,
    depthWrite: false,
  });
  const background = new THREE.Mesh(new THREE.PlaneGeometry(0.43, 0.06), backMaterial);
  background.renderOrder = 8;
  group.add(background);
  const fillWidth = 0.39;
  const fill = new THREE.Mesh(new THREE.PlaneGeometry(fillWidth, 0.028), fillMaterial);
  fill.position.z = 0.002;
  fill.renderOrder = 9;
  group.add(fill);
  group.userData.fill = fill;
  group.userData.fillWidth = fillWidth;
  return group;
}

export function updateWorldHealthBar(
  unit: AllyUnit | EnemyUnit,
  camera: THREE.PerspectiveCamera,
  phase: BattleSnapshot['phase'],
  result: BattleSnapshot['result'],
): void {
  const ratio = unit.maxHp > 0 ? clamp01(unit.hp / unit.maxHp) : 0;
  const fill = unit.healthBar.userData.fill;
  const fillWidth = unit.healthBar.userData.fillWidth ?? 0.39;
  if (fill) {
    fill.scale.x = Math.max(0.001, ratio);
    fill.position.x = -(fillWidth * (1 - ratio)) / 2;
  }
  unit.healthBar.visible = unit.root.visible
    && (unit.alive || unit.state === 'defeat')
    && !(phase === 'result' && result === 'victory');
  const standingOffset = unit.side === 'enemy'
    ? unit.scaleClass === 'boss'
      ? 0.72
      : unit.scaleClass === 'elite'
        ? 0.50
        : 0.38
    : 0.34;
  const defeatOffset = unit.side === 'enemy' ? 0.24 : 0.18;
  unit.healthBar.position.set(
    unit.root.position.x,
    Math.max(0.31, unit.root.position.y + (unit.state === 'defeat' ? defeatOffset : standingOffset)),
    unit.root.position.z + 0.015,
  );
  unit.healthBar.quaternion.copy(camera.quaternion);
}

export function createAllyDefeatEyes(root: THREE.Object3D): {
  normalEyes: THREE.Object3D[];
  xEyes: THREE.Object3D[];
} {
  const normalEyes = ['Eye_L', 'Eye_R']
    .map((name) => root.getObjectByName(name))
    .filter((eye): eye is THREE.Object3D => Boolean(eye));
  if (normalEyes.length !== 2) return { normalEyes, xEyes: [] };

  const xMaterial = new THREE.MeshBasicMaterial({
    color: '#ffe9f1',
    depthTest: false,
    depthWrite: false,
  });
  const barGeometry = new THREE.BoxGeometry(0.44, 0.09, 0.045);
  const xEyes: THREE.Object3D[] = [];
  root.updateMatrixWorld(true);

  for (const eye of normalEyes) {
    const worldPosition = eye.getWorldPosition(new THREE.Vector3());
    const rootLocalPosition = root.worldToLocal(worldPosition.clone());
    const group = new THREE.Group();
    group.name = `${eye.name}_DefeatX`;
    group.position.copy(rootLocalPosition);
    group.userData.defeatEyeBasePosition = rootLocalPosition.clone();
    for (const rotation of [-Math.PI / 4, Math.PI / 4]) {
      const bar = new THREE.Mesh(barGeometry, xMaterial);
      bar.renderOrder = 12;
      bar.rotation.z = rotation;
      group.add(bar);
    }
    group.visible = false;
    root.add(group);
    xEyes.push(group);
  }
  return { normalEyes, xEyes };
}

export function setAllyDefeatEyes(unit: AllyUnit, defeated: boolean): void {
  unit.normalEyes.forEach((eye) => { eye.visible = !defeated; });
  unit.xEyes.forEach((eye) => {
    eye.visible = defeated;
    if (!defeated) {
      const base = eye.userData.defeatEyeBasePosition as THREE.Vector3 | undefined;
      if (base !== undefined) eye.position.copy(base);
      eye.scale.set(1, 1, 1);
    }
  });
}

/** Keep the mandatory × eyes on the flattened face without inheriting model-specific FaceRoot transforms. */
export function compensateAllyDefeatEyeScale(
  unit: AllyUnit,
  bodyScaleX: number,
  bodyScaleY: number,
  bodyScaleZ: number,
): void {
  unit.xEyes.forEach((eye) => {
    const base = eye.userData.defeatEyeBasePosition as THREE.Vector3 | undefined;
    if (base !== undefined) {
      eye.position.set(
        base.x * bodyScaleX,
        base.y * bodyScaleY,
        base.z * bodyScaleZ,
      );
    }
    eye.scale.set(1, 1, 1);
  });
}

export function setEnemyDefeatEyes(
  normalEyes: readonly THREE.Object3D[],
  xEyes: readonly THREE.Object3D[],
  defeated: boolean,
): void {
  normalEyes.forEach((eye) => { eye.visible = !defeated; });
  xEyes.forEach((eye) => { eye.visible = defeated; });
}
