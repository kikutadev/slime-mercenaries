import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { applyEnemyDefeatFacePose, buildEnemyDefeatEyes, followsAncestor } from './face';

const pose = { scaleX: 1.20, scaleY: 0.46, scaleZ: 0.82 };

describe('enemy defeat face attachment', () => {
  it('emulates BodyRoot deformation when legacy FaceRoot is a sibling', () => {
    const root = new THREE.Group();
    const body = new THREE.Group();
    const face = new THREE.Group();
    root.add(body, face);

    const basePosition = new THREE.Vector3(0.18, 0.42, -0.31);
    const baseScale = new THREE.Vector3(1.0, 0.9, 1.1);
    face.position.copy(basePosition);
    face.scale.copy(baseScale);

    expect(followsAncestor(face, body)).toBe(false);
    applyEnemyDefeatFacePose(face, body, basePosition, baseScale, pose);

    expect(face.position.x).toBeCloseTo(basePosition.x * pose.scaleX);
    expect(face.position.y).toBeCloseTo(basePosition.y * pose.scaleY);
    expect(face.position.z).toBeCloseTo(basePosition.z * pose.scaleZ);
    expect(face.scale.x).toBeCloseTo(baseScale.x * pose.scaleX);
    expect(face.scale.y).toBeCloseTo(baseScale.y * pose.scaleY);
    expect(face.scale.z).toBeCloseTo(baseScale.z * pose.scaleZ);
  });

  it('does not double-deform a FaceRoot already parented under BodyRoot motion', () => {
    const root = new THREE.Group();
    const body = new THREE.Group();
    const primary = new THREE.Group();
    const face = new THREE.Group();
    root.add(body);
    body.add(primary);
    primary.add(face);

    const basePosition = new THREE.Vector3(0.02, -0.30, 0.08);
    const baseScale = new THREE.Vector3(0.9, 1.0, 0.95);
    face.position.copy(basePosition);
    face.scale.copy(baseScale);

    expect(followsAncestor(face, body)).toBe(true);
    applyEnemyDefeatFacePose(face, body, basePosition, baseScale, pose);

    expect(face.position.toArray()).toEqual(basePosition.toArray());
    expect(face.scale.toArray()).toEqual(baseScale.toArray());
  });

  it('sizes defeat X marks from each authored eye footprint instead of a fixed battle size', () => {
    const model = new THREE.Group();
    const face = new THREE.Group();
    model.add(face);

    for (const [name, x] of [['Eye_L', -0.04], ['Eye_R', 0.04]] as const) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshBasicMaterial());
      eye.name = name;
      eye.position.set(x, 0, 0);
      eye.scale.set(0.012, 0.008, 0.015);
      face.add(eye);
    }

    const { normalEyes, xEyes } = buildEnemyDefeatEyes(model);
    expect(normalEyes).toHaveLength(2);
    expect(xEyes).toHaveLength(2);
    for (const mark of xEyes) {
      const bar = mark.children[0] as THREE.Mesh<THREE.BoxGeometry>;
      expect(bar.geometry.parameters.width).toBeGreaterThanOrEqual(0.020);
      expect(bar.geometry.parameters.width).toBeLessThan(0.040);
      expect(mark.visible).toBe(false);
    }
  });

});