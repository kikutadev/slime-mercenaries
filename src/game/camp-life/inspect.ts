import type { SlimeId } from '../slimes';
import { CAMP_LIFE_STATIONS, campLifeHomeForSlot, yawToward } from '../camp-life-layout';
import { basePose, travel } from './base';
import { mod, pulse } from './math';
import type { CampLifePose } from './types';

export type InspectActivity = 'inspect-rack' | 'inspect-nursery' | 'inspect-altar';
export type InspectStationId = 'weapon-rack' | 'nursery' | 'fusion-altar';

export function inspectStationPose(
  timeSec: number,
  slotIndex: number,
  slimeId: SlimeId,
  stationId: InspectStationId,
  activity: InspectActivity,
  cycleSec: number,
): CampLifePose {
  const t = mod(timeSec, cycleSec);
  const home = campLifeHomeForSlot(slotIndex);
  const station = CAMP_LIFE_STATIONS[stationId];
  const pose = basePose(slotIndex, timeSec);

  if (t < 1.35) return pose;
  if (t < 3.10) {
    return travel(
      pose,
      t,
      1.35,
      1.75,
      home.position.x,
      home.position.z,
      station.position.x,
      station.position.z,
    );
  }

  if (t < 8.65) {
    const local = t - 3.10;
    const firstLook = pulse(local, 0.45, 0.90);
    const secondLook = pulse(local, 2.05, 0.90);
    const delight = pulse(local, 3.70, 0.72);
    const curious = Math.max(firstLook, secondLook);
    const isRack = activity === 'inspect-rack';
    const isNursery = activity === 'inspect-nursery';
    const isAltar = activity === 'inspect-altar';
    const nurserySurprise = isNursery ? pulse(local, 2.78, 0.48) : 0;
    const altarHum = isAltar ? 0.5 + Math.sin(local * 3.1) * 0.5 : 0;
    const rackAdmire = isRack ? delight : 0;
    const wandAffinity = isAltar && slimeId === 'wand' ? 1 : 0;

    return {
      ...pose,
      activity,
      x: station.position.x + nurserySurprise * 0.08,
      y: station.position.y + delight * 0.05 + altarHum * wandAffinity * 0.012,
      z: station.position.z + nurserySurprise * 0.10,
      yaw: yawToward(station.position, station.facingTarget)
        + Math.sin(local * 1.65) * curious * 0.08,
      roll: (isRack ? -1 : 1) * curious * 0.025 + nurserySurprise * 0.035,
      bodySquash: 0.03 + nurserySurprise * 0.08 + delight * 0.035,
      bodyStretch: delight * 0.065 + wandAffinity * altarHum * 0.035,
      lean: -curious * 0.055 + nurserySurprise * 0.10 - wandAffinity * altarHum * 0.025,
      wobble: Math.sin(local * 2.4) * curious * 0.035 + delight * 0.055,
      eyeOpen: 1,
      mouthOpen: 1 + delight * (isNursery ? 0.25 : 0.12),
      mouthWidth: 1 + delight * 0.08,
      equipmentAngle: rackAdmire * 0.13 + wandAffinity * altarHum * 0.07,
      practiceImpact: 0,
    };
  }

  if (t < 10.45) {
    return travel(
      pose,
      t,
      8.65,
      1.80,
      station.position.x,
      station.position.z,
      home.position.x,
      home.position.z,
    );
  }

  return pose;
}
