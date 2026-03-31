import { LandingBackground } from '@/components/landing/LandingBackground';
import { HeroSection } from '@/components/landing/HeroSection';
import { AboutSection } from '@/components/landing/AboutSection';
import { CategoriesSection } from '@/components/landing/CategoriesSection';
import { EventsGrid } from '@/components/landing/EventsGrid';
import { ScheduleSection } from '@/components/landing/ScheduleSection';
import { QuoteSection } from '@/components/landing/QuoteSection';
import { FooterSection } from '@/components/landing/FooterSection';

export default function LandingPage() {
  return (
    <div className="relative z-10 bg-black">
      <LandingBackground />
      <HeroSection />
      <AboutSection />
      <CategoriesSection />
      <EventsGrid />
      <ScheduleSection />
      <QuoteSection />
      <FooterSection />
    </div>
  );
}
