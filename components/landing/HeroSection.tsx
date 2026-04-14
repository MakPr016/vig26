'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isLive: boolean;
}

export function HeroSection() {
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const [countdown, setCountdown] = useState<CountdownState>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isLive: false,
  });

  useEffect(() => {
    const eventDate = new Date('2026-04-23T00:00:00').getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = eventDate - now;

      if (distance <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, isLive: true });
        return;
      }

      setCountdown({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
        isLive: false,
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative -mt-10 h-dvh w-full flex flex-col items-center justify-center px-4 text-center pointer-events-none">
      <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-4">
        Coming Soon
      </p>
      <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">
        Vigyan<span className="text-orange-500">rang</span>
      </h1>
      <p className="text-zinc-300 text-base mb-10">
        The official platform for registrations, events, and everything in between.
      </p>

      <div className="flex items-center justify-center gap-3 mb-10 pointer-events-auto">
        <Link
          href="/events"
          className="px-5 py-2.5 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Browse Events
        </Link>
        {isAuthenticated ? (
          <Link
            href="/dashboard"
            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-sm font-semibold rounded-lg transition-colors"
          >
            My Events
          </Link>
        ) : (
          <Link
            href="/auth/login"
            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Sign In
          </Link>
        )}
      </div>

      {!countdown.isLive ? (
        <div className="flex items-center justify-center gap-6">
          <div className="flex flex-col items-center">
            <span className="text-3xl font-light text-white tabular-nums">
              {String(countdown.days).padStart(2, '0')}
            </span>
            <span className="text-xs text-zinc-400 uppercase tracking-widest mt-1">Days</span>
          </div>
          <div className="w-px h-12 bg-white/20" />
          <div className="flex flex-col items-center">
            <span className="text-3xl font-light text-white tabular-nums">
              {String(countdown.hours).padStart(2, '0')}
            </span>
            <span className="text-xs text-zinc-400 uppercase tracking-widest mt-1">Hrs</span>
          </div>
          <div className="w-px h-12 bg-white/20" />
          <div className="flex flex-col items-center">
            <span className="text-3xl font-light text-white tabular-nums">
              {String(countdown.minutes).padStart(2, '0')}
            </span>
            <span className="text-xs text-zinc-400 uppercase tracking-widest mt-1">Mins</span>
          </div>
          <div className="w-px h-12 bg-white/20" />
          <div className="flex flex-col items-center">
            <span className="text-3xl font-light text-white tabular-nums">
              {String(countdown.seconds).padStart(2, '0')}
            </span>
            <span className="text-xs text-zinc-400 uppercase tracking-widest mt-1">Secs</span>
          </div>
        </div>
      ) : (
        <Link
          href="/events"
          className="text-orange-500 hover:text-orange-400 font-semibold transition-colors pointer-events-auto"
        >
          Vigyaanrang 2026 is live
        </Link>
      )}
    </div>
  );
}
