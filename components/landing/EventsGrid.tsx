'use client';

import { useReveal } from '@/hooks/useReveal';

const EVENTS = [
  {
    id: 1,
    title: 'Hackathon',
    category: 'Code & Tech',
    day: 'April 23–25',
    venue: 'Main Hall',
  },
  {
    id: 2,
    title: 'UI/UX Sprint',
    category: 'Design & Creativity',
    day: 'April 23',
    venue: 'Design Lab',
  },
  {
    id: 3,
    title: 'Raga Remix',
    category: 'Music & Performance',
    day: 'April 24',
    venue: 'Amphitheatre',
  },
  {
    id: 4,
    title: 'Tech Trivia',
    category: 'Knowledge & Quiz',
    day: 'April 24',
    venue: 'Seminar Hall',
  },
  {
    id: 5,
    title: 'Competitive Programming',
    category: 'Code & Tech',
    day: 'April 25',
    venue: 'Computer Lab',
  },
  {
    id: 6,
    title: 'Design Workshop',
    category: 'Design & Creativity',
    day: 'April 23',
    venue: 'Design Lab',
  },
];

export function EventsGrid() {
  const ref = useReveal('.reveal');

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="border-t border-white/10 bg-black/20 backdrop-blur-md px-[6%] py-24"
    >
      <div className="mb-12">
        <h2 className="reveal text-4xl lg:text-5xl font-light text-white">
          Featured Events
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {EVENTS.map((event) => (
          <div
            key={event.id}
            className="reveal bg-white/5 backdrop-blur-sm border border-white/10 overflow-hidden hover:bg-white/10 hover:border-orange-500/30 transition-all"
          >
            <div className="aspect-video bg-white/5 flex items-center justify-center">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-zinc-600"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>

            <div className="p-6">
              <div className="text-xs font-light text-orange-500 uppercase tracking-wider mb-2">
                {event.category}
              </div>
              <h3 className="text-xl font-light text-white mb-4">
                {event.title}
              </h3>
              <div className="flex flex-col gap-2 text-sm text-zinc-400">
                <div>{event.day}</div>
                <div>{event.venue}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
