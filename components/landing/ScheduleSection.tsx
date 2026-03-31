'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const SCHEDULE = {
  'Day 1': [
    { time: '09:00', name: 'Opening Ceremony', venue: 'Auditorium' },
    { time: '10:00', name: 'Hackathon Begins', venue: 'Main Hall' },
    { time: '14:00', name: 'Tech Trivia', venue: 'Seminar Hall' },
    { time: '18:00', name: 'Cultural Evening', venue: 'Amphitheatre' },
  ],
  'Day 2': [
    { time: '09:00', name: 'Hackathon Continues', venue: 'Main Hall' },
    { time: '10:00', name: 'Raga Remix Prelims', venue: 'Amphitheatre' },
    { time: '12:00', name: 'Tech Trivia Finals', venue: 'Seminar Hall' },
    { time: '18:00', name: 'Cultural Evening Day 2', venue: 'Open Grounds' },
  ],
  'Day 3': [
    { time: '09:00', name: 'Competitive Programming', venue: 'Computer Lab' },
    { time: '11:00', name: 'Hackathon Final Submissions', venue: 'Main Hall' },
    { time: '14:00', name: 'Results & Felicitation', venue: 'Auditorium' },
    { time: '18:30', name: 'Closing Ceremony', venue: 'Main Auditorium' },
  ],
};

const allEvents = Object.entries(SCHEDULE).flatMap(([day, events]) =>
  events.map((evt) => ({ ...evt, day }))
);

export function ScheduleSection() {
  const [expandedDay, setExpandedDay] = useState<string | null>('Day 1');
  const [activeIndex, setActiveIndex] = useState(0);
  const desktopRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const prevIndexRef = useRef(0);

  useEffect(() => {
    const isMobile = window.innerWidth < 1024;
    if (isMobile || !desktopRef.current || !fillRef.current) return;

    gsap.set(fillRef.current, { scaleY: 0, transformOrigin: 'top center' });

    ScrollTrigger.create({
      trigger: desktopRef.current,
      start: 'top top',
      end: `+=${allEvents.length * 150}%`,
      pin: true,
      scrub: 0.8,
      onUpdate: (self) => {
        gsap.set(fillRef.current!, {
          scaleY: self.progress,
          transformOrigin: 'top center',
        });

        const index = Math.min(
          Math.floor(self.progress * allEvents.length),
          allEvents.length - 1
        );

        if (index !== prevIndexRef.current) {
          prevIndexRef.current = index;
          setActiveIndex(index);

          if (cardRef.current) {
            gsap.fromTo(
              cardRef.current,
              { opacity: 0, y: 16 },
              { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
            );
          }
        }
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  const active = allEvents[activeIndex];

  return (
    <section className="border-t border-white/10">

      {/* Desktop: full-viewport pinned layout — no extra wrappers */}
      <div
        ref={desktopRef}
        className="hidden lg:grid h-screen bg-black/20 backdrop-blur-md"
        style={{ gridTemplateColumns: '1fr 1px 1fr' }}
      >
        {/* Left: heading + event list */}
        <div className="flex flex-col justify-center px-[8%] py-16 overflow-y-auto">
          <h2 className="text-4xl xl:text-5xl font-light text-white mb-12">
            Schedule
          </h2>
          <ul className="space-y-4">
            {allEvents.map((event, idx) => (
              <li
                key={idx}
                className="flex gap-4 items-baseline transition-all duration-300"
              >
                <span
                  className="text-xs tabular-nums shrink-0 font-light w-10"
                  style={{ color: idx === activeIndex ? '#f97316' : '#52525b' }}
                >
                  {event.time}
                </span>
                <span
                  className="text-sm font-light leading-snug transition-all duration-300"
                  style={{
                    color: idx === activeIndex ? '#ffffff' : '#52525b',
                    transform: idx === activeIndex ? 'translateX(4px)' : 'none',
                  }}
                >
                  {event.name}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Middle: progress track */}
        <div className="relative bg-white/10 self-stretch">
          <div
            ref={fillRef}
            className="absolute inset-x-0 top-0 h-full bg-orange-500"
          />
        </div>

        {/* Right: active event card */}
        <div className="flex items-center px-[8%] py-16">
          <div
            ref={cardRef}
            className="w-full bg-white/5 backdrop-blur-sm border border-orange-500/20 p-12"
          >
            <div className="text-xs text-orange-500 uppercase tracking-widest font-light mb-1">
              {active.day}
            </div>
            <div className="text-xs text-zinc-500 uppercase tracking-widest font-light mb-8">
              {active.time}
            </div>
            <div className="text-4xl xl:text-5xl font-light text-white leading-tight mb-8">
              {active.name}
            </div>
            <div className="w-12 h-px bg-orange-500/50 mb-8" />
            <div className="flex items-center gap-3 text-sm text-zinc-400 font-light">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                <circle cx="12" cy="9" r="2.5"/>
              </svg>
              {active.venue}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Accordion */}
      <div className="lg:hidden bg-black/20 backdrop-blur-md px-[6%] py-20">
        <h2 className="text-4xl font-light text-white mb-10">Schedule</h2>
        <div className="space-y-3">
          {Object.entries(SCHEDULE).map(([day, events]) => (
            <div key={day} className="bg-white/5 backdrop-blur-sm border border-white/10">
              <button
                onClick={() => setExpandedDay(expandedDay === day ? null : day)}
                className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <h3 className="text-lg font-light text-white">{day}</h3>
                <svg
                  className={`w-5 h-5 text-zinc-400 transition-transform ${
                    expandedDay === day ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {expandedDay === day && (
                <div className="border-t border-white/10 relative">
                  <div className="absolute left-6 top-0 bottom-0 w-px bg-orange-500/30" />
                  <div className="pl-12 pr-6 py-5 space-y-5">
                    {events.map((event, idx) => (
                      <div key={idx} className="flex flex-col gap-0.5">
                        <div className="text-xs text-orange-500 font-light uppercase tracking-wider">
                          {event.time}
                        </div>
                        <div className="text-sm text-white font-light">
                          {event.name}
                        </div>
                        <div className="text-xs text-zinc-400">
                          {event.venue}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
