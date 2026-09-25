import { clamp01 } from '../slime-motion';

export function mod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

export function segment(time: number, start: number, duration: number): number {
  return clamp01((time - start) / duration);
}

export function pulse(time: number, start: number, duration: number): number {
  const u = segment(time, start, duration);
  return u <= 0 || u >= 1 ? 0 : Math.sin(u * Math.PI);
}

export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}
