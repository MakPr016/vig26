"use client";

import Link from "next/link";
import Hyperspeed from "@/components/Hyperspeed";
import { useEffect } from "react";

const HYPERSPEED_OPTIONS = {
    distortion: "turbulentDistortion",
    length: 400,
    roadWidth: 9,
    islandWidth: 1,
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
        roadColor: 526344,
        islandColor: 657930,
        background: 0,
        shoulderLines: 1250072,
        brokenLines: 1250072,
        leftCars: [14441248, 14459680, 14426144],
        rightCars: [3361783, 15066861, 12568307],
        sticks: 12970219,
    },
};

export default function LandingPage() {
    // Three.js sets the canvas size without CSS (setSize false flag) at init.
    // onWindowResize is the only path that correctly applies CSS dimensions,
    // so dispatch a resize event after mount to guarantee full-viewport coverage.
    useEffect(() => {
        const id = setTimeout(() => window.dispatchEvent(new Event("resize")), 50);
        return () => clearTimeout(id);
    }, []);

    return (
        <div className="relative -mt-10 h-dvh w-full overflow-hidden bg-black">

            {/* absolute inset-0 so the canvas fills the hero exactly */}
            <div className="absolute inset-0">
                {/* <Hyperspeed effectOptions={HYPERSPEED_OPTIONS} /> */}
                <Hyperspeed
                    effectOptions={{
                        "distortion": "mountainDistortion", "length": 400, "roadWidth": 9, "islandWidth": 2, "lanesPerRoad": 3, "fov": 90, "fovSpeedUp": 150, "speedUp": 2, "carLightsFade": 0.4, "totalSideLightSticks": 50, "lightPairsPerRoadWay": 50, "shoulderLinesWidthPercentage": 0.05, "brokenLinesWidthPercentage": 0.1, "brokenLinesLengthPercentage": 0.5, "lightStickWidth": [0.12, 0.5], "lightStickHeight": [1.3, 1.7], "movingAwaySpeed": [60, 80], "movingCloserSpeed": [-120, -160], "carLightsLength": [20, 60], "carLightsRadius": [0.05, 0.14], "carWidthPercentage": [0.3, 0.5], "carShiftX": [-0.2, 0.2], "carFloorSeparation": [0.05, 1], colors: {
                            roadColor: 0x080808,          // Deep black road for contrast
                            islandColor: 0x0a0a0a,        // Slightly lighter island
                            background: 0x000000,        // Pure black background
                            shoulderLines: 0xff8c00,      // Dark Orange shoulder lines
                            brokenLines: 0xffffff,        // White broken lines for "speed" feel
                            // Left Cars: Various shades of vibrant Orange
                            leftCars: [0xff4500, 0xffa500, 0xff8c00],
                            // Right Cars: Warm whites and pale ambers to complement the orange
                            rightCars: [0xffffff, 0xffe4b5, 0xfffacd],
                            sticks: 0xff8c00,             // Orange side light sticks
                        },
                    }}
                />
            </div>

            {/* Overlay — pointer-events-none so clicks reach the canvas */}
            <div className="absolute inset-0 bg-black/50 pointer-events-none" />

            {/* Hero content — pointer-events-none on wrapper, restored on interactive children */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4 text-center pointer-events-none">
                <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-4">
                    Coming Soon
                </p>
                <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">
                    Vigyan<span className="text-orange-500">rang</span>
                </h1>
                <p className="text-zinc-300 text-base mb-10">
                    The official platform for registrations, events, and everything in between.
                </p>
                <div className="flex items-center justify-center gap-3 pointer-events-auto">
                    <Link
                        href="/events"
                        className="px-5 py-2.5 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold rounded-lg transition-colors"
                    >
                        Browse Events
                    </Link>
                    <Link
                        href="/auth/login"
                        className="px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-sm font-semibold rounded-lg transition-colors"
                    >
                        Sign In
                    </Link>
                </div>
            </div>

            {/* Management link */}
            <div className="absolute bottom-6 left-0 right-0 z-10 text-center text-xs text-zinc-400 pointer-events-auto">
                Management?{" "}
                <Link href="/manage/login" className="text-zinc-200 hover:text-white transition-colors">
                    Sign in here
                </Link>
            </div>
        </div>
    );
}
