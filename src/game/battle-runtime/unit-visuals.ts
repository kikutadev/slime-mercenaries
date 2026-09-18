import * as THREE from 'three';
import { clamp01 } from '../slime-motion';
import type { BattleSceneOwner } from './scene-owner';
import type { AllyUnit, BasicMaterial, BattleSnapshot, HealthBarGroup } from './types';

export function createShadow(
  sceneOwner: BattleSceneOwner,
  radius = 0.3,
): THREE.Mesh<THREE.CircleGeometry, BasicMaterial> {
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
  sceneOwner.add(shadow);
  return shadow;
}

export function createWorldHealthBar(sceneOwner: BattleSceneOwner): HealthBarGroup {
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
    color: '#58d681',
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
  sceneOwner.add(group);
  return group;
}

export function updateWorldHealthBar(
  unit: AllyUnit,
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
  unit.healthBar.position.set(
    unit.root.position.x,
    Math.max(0.31, unit.root.position.y + (unit.state === 'defeat' ? 0.18 : 0.34)),
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

  const xMaterial = new THREE.MeshBasicMaterial({ color: '#201925' });
  const barGeometry = new THREE.BoxGeometry(0.28, 0.052, 0.034);
  const xEyes: THREE.Object3D[] = [];
  for (const eye of normalEyes) {
    const group = new THREE.Group();
    group.name = eye.name + '_DefeatX';
    group.position.copy(eye.position);
    group.position.z += 0.068;
    for (const rotation of [-Math.PI / 4, Math.PI / 4]) {
      const bar = new THREE.Mesh(barGeometry, xMaterial);
      bar.rotation.z = rotation;
      group.add(bar);
    }
    group.visible = false;
    eye.parent?.add(group);
    xEyes.push(group);
  }
  return { normalEyes, xEyes };
}

export function setAllyDefeatEyes(unit: AllyUnit, defeated: boolean): void {
  unit.normalEyes.forEach((eye) => { eye.visible = !defeated; });
  unit.xEyes.forEach((eye) => { eye.visible = defeated; });
}

export function createEnemyDefeatEyes(
  normalEyes: readonly THREE.Object3D[],
): THREE.Object3D[] {
  if (normalEyes.length !== 2) return [];
  const material = new THREE.MeshBasicMaterial({ color: '#261d2b' });
  const geometry = new THREE.BoxGeometry(0.072, 0.020, 0.018);
  return normalEyes.flatMap((eye) => {
    if (eye.parent === null) return [];
    const group = new THREE.Group();
    group.name = eye.name + '_DefeatX';
    group.position.copy(eye.position);
    group.position.z += 0.022;
    for (const rotation of [-Math.PI / 4, Math.PI / 4]) {
      const bar = new THREE.Mesh(geometry, material);
      bar.rotation.z = rotation;
      group.add(bar);
    }
    group.visible = false;
    eye.parent.add(group);
    return [group];
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
