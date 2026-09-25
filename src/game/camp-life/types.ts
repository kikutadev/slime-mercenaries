export type CampLifeActivity =
  | 'idle'
  | 'travel'
  | 'practice'
  | 'yawn'
  | 'drowsy'
  | 'sleep'
  | 'wake'
  | 'chat'
  | 'inspect-rack'
  | 'inspect-nursery'
  | 'inspect-altar';

export interface CampLifePose {
  activity: CampLifeActivity;
  x: number;
  y: number;
  z: number;
  yaw: number;
  roll: number;
  bodySquash: number;
  bodyStretch: number;
  lean: number;
  wobble: number;
  eyeOpen: number;
  mouthOpen: number;
  mouthWidth: number;
  equipmentAngle: number;
  practiceImpact: number;
}
