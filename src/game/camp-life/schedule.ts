import type { SlimeId } from '../slimes';
import type { CampTemperament } from '../camp-temperament';
import { basePose } from './base';
import { inspectStationPose } from './inspect';
import { mod } from './math';
import { restPose } from './rest';
import { chatPose } from './social';
import { trainingPose } from './training';
import type { CampLifePose } from './types';

export const CAMP_LIFE_PHASE_SEC = 18;

const TRAINING_CYCLE_SEC = CAMP_LIFE_PHASE_SEC;
const REST_CYCLE_SEC = CAMP_LIFE_PHASE_SEC;
const CHAT_CYCLE_SEC = CAMP_LIFE_PHASE_SEC;


function signatureClock(
  phaseTime: number,
  activeStart: number,
  activeEnd: number,
  returnEnd: number,
): number {
  const arrivalWindowSec = 3;
  const returnWindowSec = 3;
  const activeWindowEnd = CAMP_LIFE_PHASE_SEC - returnWindowSec;
  if (phaseTime < arrivalWindowSec) {
    return (phaseTime / arrivalWindowSec) * activeStart;
  }
  if (phaseTime < activeWindowEnd) {
    const activeLength = activeEnd - activeStart;
    return activeStart + mod((phaseTime - arrivalWindowSec) * 0.9, activeLength);
  }
  const returnProgress = (phaseTime - activeWindowEnd) / returnWindowSec;
  return activeEnd + (returnEnd - activeEnd) * returnProgress;
}

export function getCampLifePose(
  timeSec: number,
  slotIndex: number,
  slimeId: SlimeId,
  temperament: CampTemperament | null = null,
): CampLifePose {
  const phase = Math.floor(Math.max(0, timeSec) / CAMP_LIFE_PHASE_SEC) % 6;
  const phaseTime = mod(timeSec, CAMP_LIFE_PHASE_SEC);

  // Temperament residents spend most of each phase doing something that reads as
  // "their thing". The authored motion is time-stretched to fill the whole phase so
  // a 30–45 second glance at Camp can reveal stable personality instead of a brief
  // animation followed by a long identical idle.
  if (temperament !== null) {
    if (temperament === 'eager') {
      if (phase % 3 === 2) {
        return inspectStationPose(
          signatureClock(phaseTime, 3.10, 8.65, 10.45),
          slotIndex,
          slimeId,
          'weapon-rack',
          'inspect-rack',
          CAMP_LIFE_PHASE_SEC,
        );
      }
      return trainingPose(signatureClock(phaseTime, 3.05, 6.55, 8.25), slimeId, slotIndex, TRAINING_CYCLE_SEC);
    }

    if (temperament === 'sleepy') {
      if (phase % 3 === 2) {
        return chatPose(
          signatureClock(phaseTime, 3.55, 8.45, 10.15),
          slotIndex,
          slotIndex % 2 === 0 ? 'left' : 'right',
          CHAT_CYCLE_SEC,
        );
      }
      return restPose(signatureClock(phaseTime, 4.45, 9.80, 12.80), slotIndex, REST_CYCLE_SEC);
    }

    if (temperament === 'social') {
      if (phase % 3 === 2) {
        return inspectStationPose(
          signatureClock(phaseTime, 3.10, 8.65, 10.45),
          slotIndex,
          slimeId,
          'nursery',
          'inspect-nursery',
          CAMP_LIFE_PHASE_SEC,
        );
      }
      return chatPose(
        signatureClock(phaseTime, 3.55, 8.45, 10.15),
        slotIndex,
        slotIndex % 2 === 0 ? 'left' : 'right',
        CHAT_CYCLE_SEC,
      );
    }

    const curiousStation = phase % 3 === 0
      ? 'weapon-rack'
      : phase % 3 === 1
        ? 'nursery'
        : 'fusion-altar';
    const curiousActivity = curiousStation === 'weapon-rack'
      ? 'inspect-rack'
      : curiousStation === 'nursery'
        ? 'inspect-nursery'
        : 'inspect-altar';
    return inspectStationPose(
      signatureClock(phaseTime, 3.10, 8.65, 10.45),
      slotIndex,
      slimeId,
      curiousStation,
      curiousActivity,
      CAMP_LIFE_PHASE_SEC,
    );
  }

  if (phase === 0) {
    if (slotIndex === 0) return trainingPose(phaseTime, slimeId, slotIndex, TRAINING_CYCLE_SEC);
    if (slotIndex === 1) return restPose(phaseTime, slotIndex, REST_CYCLE_SEC);
    if (slotIndex === 2) return chatPose(phaseTime, slotIndex, 'left', CHAT_CYCLE_SEC);
    if (slotIndex === 3) return chatPose(phaseTime, slotIndex, 'right', CHAT_CYCLE_SEC);
  }

  if (phase === 1) {
    if (slotIndex === 0) return chatPose(phaseTime, slotIndex, 'left', CHAT_CYCLE_SEC);
    if (slotIndex === 1) return chatPose(phaseTime, slotIndex, 'right', CHAT_CYCLE_SEC);
    if (slotIndex === 2) return trainingPose(phaseTime, slimeId, slotIndex, TRAINING_CYCLE_SEC);
    if (slotIndex === 3) return restPose(phaseTime, slotIndex, REST_CYCLE_SEC);
  }

  if (phase === 2) {
    if (slotIndex === 0) return restPose(phaseTime, slotIndex, REST_CYCLE_SEC);
    if (slotIndex === 1) return trainingPose(phaseTime, slimeId, slotIndex, TRAINING_CYCLE_SEC);
    if (slotIndex === 2) return chatPose(phaseTime, slotIndex, 'left', CHAT_CYCLE_SEC);
    if (slotIndex === 3) return chatPose(phaseTime, slotIndex, 'right', CHAT_CYCLE_SEC);
  }

  if (phase === 3) {
    if (slotIndex === 0) return chatPose(phaseTime, slotIndex, 'left', CHAT_CYCLE_SEC);
    if (slotIndex === 1) return chatPose(phaseTime, slotIndex, 'right', CHAT_CYCLE_SEC);
    if (slotIndex === 2) return restPose(phaseTime, slotIndex, REST_CYCLE_SEC);
    if (slotIndex === 3) return trainingPose(phaseTime, slimeId, slotIndex, TRAINING_CYCLE_SEC);
  }

  if (phase === 4) {
    if (slotIndex === 0) {
      return inspectStationPose(
        phaseTime,
        slotIndex,
        slimeId,
        'weapon-rack',
        'inspect-rack',
        CAMP_LIFE_PHASE_SEC,
      );
    }
    if (slotIndex === 1) {
      return inspectStationPose(
        phaseTime,
        slotIndex,
        slimeId,
        'nursery',
        'inspect-nursery',
        CAMP_LIFE_PHASE_SEC,
      );
    }
    if (slotIndex === 2) {
      return inspectStationPose(
        phaseTime,
        slotIndex,
        slimeId,
        'fusion-altar',
        'inspect-altar',
        CAMP_LIFE_PHASE_SEC,
      );
    }
    if (slotIndex === 3) return restPose(phaseTime, slotIndex, REST_CYCLE_SEC);
  }

  if (phase === 5) {
    if (slotIndex === 0) {
      return inspectStationPose(
        phaseTime,
        slotIndex,
        slimeId,
        'fusion-altar',
        'inspect-altar',
        CAMP_LIFE_PHASE_SEC,
      );
    }
    if (slotIndex === 1) {
      return inspectStationPose(
        phaseTime,
        slotIndex,
        slimeId,
        'weapon-rack',
        'inspect-rack',
        CAMP_LIFE_PHASE_SEC,
      );
    }
    if (slotIndex === 2) {
      return inspectStationPose(
        phaseTime,
        slotIndex,
        slimeId,
        'nursery',
        'inspect-nursery',
        CAMP_LIFE_PHASE_SEC,
      );
    }
    if (slotIndex === 3) return trainingPose(phaseTime, slimeId, slotIndex, TRAINING_CYCLE_SEC);
  }

  return basePose(slotIndex, phaseTime);
}

export const CAMP_LIFE_CYCLE_DURATIONS = {
  training: TRAINING_CYCLE_SEC,
  rest: REST_CYCLE_SEC,
  chat: CHAT_CYCLE_SEC,
  phase: CAMP_LIFE_PHASE_SEC,
} as const;
