import {
  clampEnemy01,
  type EnemyDefeatPose,
  type EnemyHitPose,
  type EnemyMotionProfile,
  type EnemyPose,
} from './shared';

export type MimicBehaviorId = 'mimic-chest-snap';

function smooth(value: number): number {
  const t = clampEnemy01(value);
  return t * t * (3 - 2 * t);
}

function idle(now: number, phase = 0): EnemyPose {
  const breathe = Math.sin(now * 1.35 + phase);
  const peek = Math.max(0, Math.sin(now * 0.62 + phase - 0.8));
  return {
    scaleX: 1 + breathe * 0.008,
    scaleY: 1 - breathe * 0.006,
    scaleZ: 1 + breathe * 0.007,
    jump: 0,
    wobbleZ: breathe * 0.008,
    travel: 0,
    releaseProgress: -1,
    secondary: { primaryBend: -0.04 - peek * 0.05 },
  };
}

function move(now: number, phase = 0): EnemyPose {
  const cycle = (now * 1.35 + phase) % 1;
  const hop = Math.sin(cycle * Math.PI) ** 2;
  return {
    scaleX: 1 - hop * 0.055,
    scaleY: 1 + hop * 0.075,
    scaleZ: 1 - hop * 0.025,
    jump: hop * 0.085,
    wobbleZ: Math.sin(cycle * Math.PI * 2) * 0.018,
    travel: 0,
    releaseProgress: -1,
    secondary: { primaryBend: -hop * 0.10 },
  };
}

function attack(u: number): EnemyPose {
  const t = clampEnemy01(u);
  const crouch = t < 0.34 ? smooth(t / 0.34) : 1 - smooth((t - 0.34) / 0.66);
  const snap = smooth((t - 0.30) / 0.22) * (1 - smooth((t - 0.68) / 0.32));
  const lunge = smooth((t - 0.34) / 0.18) * (1 - smooth((t - 0.64) / 0.28));
  return {
    scaleX: 1 + crouch * 0.10 - snap * 0.08,
    scaleY: 1 - crouch * 0.14 + snap * 0.16,
    scaleZ: 1 + crouch * 0.04,
    jump: snap * 0.07,
    wobbleZ: 0,
    travel: lunge,
    releaseProgress: t >= 0.42 ? clampEnemy01((t - 0.42) / 0.58) : -1,
    secondary: { primaryBend: -snap * 1.20 },
  };
}

function hit(u: number, side: number): EnemyHitPose {
  const pulse = Math.sin(clampEnemy01(u) * Math.PI);
  return {
    scaleX: 1 + pulse * 0.08,
    scaleY: 1 - pulse * 0.12,
    scaleZ: 1 + pulse * 0.04,
    rotationZ: side * pulse * 0.08,
    secondary: { primaryBend: pulse * 0.20 },
  };
}

function defeat(u: number, side: number): EnemyDefeatPose {
  const t = smooth(u);
  return {
    scaleX: 1 + t * 0.24,
    scaleY: 1 - t * 0.70,
    scaleZ: 1 + t * 0.10,
    rotationZ: side * t * 0.10,
    yOffset: -0.05 * t,
    lateralDrift: side * 0.025 * t,
    backwardDrift: 0.035 * t,
    opacity: 1,
    secondary: { primaryBend: -0.42 * t },
  };
}

const profile: EnemyMotionProfile = {
  familyId: 'mimic',
  idle,
  move,
  attack,
  hit,
  defeat,
  moveDuration: 1.18,
  moveDistance: 0.72,
  attackDuration: 0.92,
  attackTravelDistance: 0.50,
  contactU: 0.53,
  defeatDuration: 0.94,
  attackVfx: {
    color: '#f0b44e',
    radius: 0.27,
    pose: (u) => {
      const t = clampEnemy01(u);
      const charge = t < 0.46 ? smooth(t / 0.46) : 1 - smooth((t - 0.46) / 0.54);
      return {
        telegraphOpacity: charge * 0.55,
        telegraphScale: 0.72 + charge * 0.40,
        impactStrength: t >= 0.50 && t <= 0.66 ? 1 : 0,
      };
    },
    impactColor: '#ffd36e',
    impactSize: 0.10,
    cameraShakeDuration: 0.08,
    cameraShakeAmplitude: 0.024,
  },
};

export const getMimicMotionProfile = (_id: MimicBehaviorId): EnemyMotionProfile => profile;
