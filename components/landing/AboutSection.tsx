'use client';

import { useReveal } from '@/hooks/useReveal';

export function AboutSection() {
  const ref = useReveal('.reveal');

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="border-t border-white/10 bg-black/30 backdrop-blur-md px-[6%] py-24"
    >
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 mb-16">
        <div>
          <h2 className="reveal text-4xl lg:text-5xl font-light text-white leading-tight mb-4">
            Experience the Festival
          </h2>
          <div className="reveal w-8 h-px bg-white mb-6" />
        </div>

        <div className="space-y-4">
          <p className="reveal text-base lg:text-lg text-zinc-300 font-light leading-relaxed">
            Vigyaanrang is a celebration of innovation, creativity, and technical excellence.
            Our fest brings together the brightest minds to compete, collaborate, and showcase their talents.
          </p>
          <p className="reveal text-base lg:text-lg text-zinc-300 font-light leading-relaxed">
            Across three days, discover workshops, competitions, performances, and networking opportunities
            that span technology, design, culture, and beyond.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 border-t border-white/10">
        <div className="reveal border-r border-white/10 py-8 px-6 md:px-0 md:pr-8">
          <div className="text-5xl font-light text-white mb-2">15+</div>
          <div className="text-xs uppercase text-zinc-400 tracking-wider">Events</div>
        </div>
        <div className="reveal border-r border-white/10 py-8 px-6 md:px-8">
          <div className="text-5xl font-light text-white mb-2">500+</div>
          <div className="text-xs uppercase text-zinc-400 tracking-wider">Participants</div>
        </div>
        <div className="reveal py-8 px-6 md:px-8">
          <div className="text-5xl font-light text-white mb-2">₹2L</div>
          <div className="text-xs uppercase text-zinc-400 tracking-wider">Prize Pool</div>
        </div>
      </div>
    </section>
  );
}
