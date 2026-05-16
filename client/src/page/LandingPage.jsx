import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

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

const LandingPage = () => {
  const { hash } = useLocation();

  // Mỗi lần vào landing thì hiển thị từ Hero ở trên cùng, không restore vị
  // trí cuộn cũ của trình duyệt (BFCache / refresh / quay lại từ tab khác).
  // Nếu URL có hash (vd. `/#dat-lich`) thì để mặc định cho trình duyệt /
  // anchor link cuộn tới section đó.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const previousRestoration = window.history.scrollRestoration;
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    if (hash) {
      const id = hash.replace(/^#/, '');
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ block: 'start' });
      }
    } else {
      window.scrollTo({ top: 0, left: 0 });
    }

    return () => {
      if ('scrollRestoration' in window.history && previousRestoration) {
        window.history.scrollRestoration = previousRestoration;
      }
    };
  }, [hash]);

  return (
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
};

export default LandingPage;
