import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import StatsSection from './StatsSection';
import PricingSection from './PricingSection';
import TestimonialsSection from './TestimonialsSection';
import CTASection from './CTASection';
import Footer from './Footer';
import Navigation from './Navigation';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black dark:bg-black">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <PricingSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
}
