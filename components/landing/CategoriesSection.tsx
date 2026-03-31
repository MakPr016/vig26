'use client';

import { useReveal } from '@/hooks/useReveal';

const CATEGORIES = [
  {
    number: '01',
    title: 'Code & Tech',
    description: 'Competitive programming, hackathons, hardware challenges',
  },
  {
    number: '02',
    title: 'Design & Creativity',
    description: 'UI/UX sprints, graphic design, digital art',
  },
  {
    number: '03',
    title: 'Music & Performance',
    description: 'Raga remix, fusion, cultural showcases',
  },
  {
    number: '04',
    title: 'Knowledge & Quiz',
    description: 'Technical quizzes, trivia, cross-domain competitions',
  },
];

export function CategoriesSection() {
  const ref = useReveal('.reveal');

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="border-t border-white/10 bg-black/20 backdrop-blur-md px-[6%] py-24"
    >
      <div className="mb-12">
        <h2 className="reveal text-4xl lg:text-5xl font-light text-white">
          Explore Categories
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {CATEGORIES.map((category) => (
          <div
            key={category.number}
            className="reveal bg-white/5 backdrop-blur-sm border border-white/10 p-8 hover:bg-white/10 hover:border-orange-500/30 transition-all"
          >
            <div className="text-sm font-light text-orange-500 uppercase tracking-wider mb-3">
              {category.number}
            </div>
            <h3 className="text-2xl font-light text-white mb-3">
              {category.title}
            </h3>
            <p className="text-sm text-zinc-400 font-light leading-relaxed">
              {category.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
