'use client';

import { useReveal } from '@/hooks/useReveal';

export function QuoteSection() {
  const ref = useReveal('.reveal');

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="border-t border-white/10 bg-black/30 backdrop-blur-md px-[6%] py-32"
    >
      <div className="max-w-3xl mx-auto text-center">
        <blockquote className="reveal text-4xl lg:text-5xl font-light text-white leading-relaxed mb-8">
          "Innovation and creativity are not opposites — they are the two wings
          of human progress."
        </blockquote>
        <cite className="reveal text-sm text-zinc-400 font-light not-italic">
          — Vigyanrang 2026
        </cite>
      </div>
    </section>
  );
}
