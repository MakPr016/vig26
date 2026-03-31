'use client';

import { useEffect } from 'react';
import Hyperspeed from '@/components/Hyperspeed';

const HYPERSPEED_OPTIONS = {
  distortion: 'mountainDistortion',
  length: 400,
  roadWidth: 9,
  islandWidth: 2,
  lanesPerRoad: 3,
  fov: 90,
  fovSpeedUp: 150,
  speedUp: 2,
  carLightsFade: 0.4,
  totalSideLightSticks: 50,
  lightPairsPerRoadWay: 50,
  shoulderLinesWidthPercentage: 0.05,
  brokenLinesWidthPercentage: 0.1,
  brokenLinesLengthPercentage: 0.5,
  lightStickWidth: [0.12, 0.5] as [number, number],
  lightStickHeight: [1.3, 1.7] as [number, number],
  movingAwaySpeed: [60, 80] as [number, number],
  movingCloserSpeed: [-120, -160] as [number, number],
  carLightsLength: [20, 60] as [number, number],
  carLightsRadius: [0.05, 0.14] as [number, number],
  carWidthPercentage: [0.3, 0.5] as [number, number],
  carShiftX: [-0.2, 0.2] as [number, number],
  carFloorSeparation: [0.05, 1] as [number, number],
  colors: {
    roadColor: 0x080808,
    islandColor: 0x0a0a0a,
    background: 0x000000,
    shoulderLines: 0xff8c00,
    brokenLines: 0xffffff,
    leftCars: [0xff4500, 0xffa500, 0xff8c00],
    rightCars: [0xffffff, 0xffe4b5, 0xfffacd],
    sticks: 0xff8c00,
  },
};

export function LandingBackground() {
  useEffect(() => {
    const id = setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="fixed inset-0 z-0">
      <Hyperspeed effectOptions={HYPERSPEED_OPTIONS} />
    </div>
  );
}
