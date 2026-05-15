import React from 'react';

import '@/features/landing/landing.css';
import Header from '@/features/landing/components/Header';
import HeroSection from '@/features/landing/components/HeroSection';
import ServiceSection from '@/features/landing/components/ServiceSection';
import ProcessSection from '@/features/landing/components/ProcessSection';
import AboutSection from '@/features/landing/components/AboutSection';
import DoctorSection from '@/features/landing/components/DoctorSection';
import PricingSection from '@/features/landing/components/PricingSection';
import TestimonialSection from '@/features/landing/components/TestimonialSection';
import BeforeAfterSection from '@/features/landing/components/BeforeAfterSection';
import FAQSection from '@/features/landing/components/FAQSection';
import BookingCTASection from '@/features/landing/components/BookingCTASection';
import Footer from '@/features/landing/components/Footer';

const LandingPage = () => (
  <div className="bg-white text-slate-700 font-sans antialiased overflow-x-hidden scroll-smooth">
    <Header />
    <main>
      <HeroSection />
      <ServiceSection />
      <ProcessSection />
      <AboutSection />
      <DoctorSection />
      <PricingSection />
      <TestimonialSection />
      <BeforeAfterSection />
      <FAQSection />
      <BookingCTASection />
    </main>
    <Footer />
  </div>
);

export default LandingPage;
