'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export function FooterSection() {
  const textRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!textRef.current) return;

    const h1 = textRef.current;
    const text = h1.innerText;

    h1.innerHTML = text
      .split('')
      .map(
        (char) =>
          `<span class="inline-block" style="backface-visibility: hidden;">${
            char === ' ' ? '&nbsp;' : char
          }</span>`
      )
      .join('');

    const chars = h1.querySelectorAll('span');
    const depth = -window.innerWidth / 8;
    const transformOrigin = `50% 50% ${depth}px`;

    gsap.set(h1, {
      perspective: 700,
      transformStyle: 'preserve-3d',
    });

    gsap.set(chars, {
      transformOrigin,
      transformStyle: 'preserve-3d',
    });

    const tl = gsap.timeline({ repeat: -1 });

    // Rotate in to visible (rotationX: 0)
    tl.fromTo(
      chars,
      { rotationX: -90 },
      { rotationX: 0, stagger: 0.04, duration: 0.5, ease: 'power2.out' }
    )
    // Hold at visible for 1 second
    .to(chars, { rotationX: 0, duration: 1 })
    // Rotate out
    .to(chars, { rotationX: 90, stagger: 0.04, duration: 0.5, ease: 'power2.in' });

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <footer className="border-t border-white/10 bg-black/40 backdrop-blur-md px-[6%] py-16">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-12">
        <div className="overflow-hidden" style={{ minHeight: '6rem' }}>
          <h1
            ref={textRef}
            className="text-6xl lg:text-7xl font-light text-white leading-none"
          >
            Vigyanrang
          </h1>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-6 text-sm text-zinc-400">
          <div>
            <p className="mb-1 font-light">Technical + Cultural Festival</p>
            <p className="font-light">&copy; 2026 Atria Institute of Technology</p>
          </div>
          <div>
            <p className="font-light">April 23–25, 2026</p>
          </div>

          <div className="pt-4 border-t border-white/10">
            <p className="text-zinc-500 font-light mb-2">Management?</p>
            <Link
              href="/manage/login"
              className="text-orange-500 hover:text-orange-400 font-light transition-colors"
            >
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
