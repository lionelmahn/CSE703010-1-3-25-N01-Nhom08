import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Phone, Star } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { BTN_PRIMARY_LG, BTN_SECONDARY, CONTAINER } from '../styles';
import { CLINIC_CONTACT, HERO_STATS } from '../data';

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <>
      <section
        id="trang-chu"
        className="relative pt-28 pb-20 md:pt-32 md:pb-24 lg:pt-36 lg:pb-28 overflow-hidden bg-white"
      >
        <div className="landing-hero-blob" aria-hidden="true" />
        <div className="landing-hero-blob landing-hero-blob--alt" aria-hidden="true" />

        <div className={`${CONTAINER} relative`}>
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-6 z-10 text-center lg:text-left">
              <Badge
                variant="accent"
                className="px-4 py-1.5 text-sm border border-blue-100 shadow-sm"
              >
                ✨ Nha Khoa Tiêu Chuẩn Quốc Tế
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
                Nụ Cười Rạng Rỡ <br />
                <span className="text-blue-600">Sức Khỏe Tuyệt Vời</span>
              </h1>
              <p className="text-slate-600 text-lg md:text-xl max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Phòng khám nha khoa cung cấp dịch vụ chăm sóc răng miệng toàn
                diện, hiện đại với đội ngũ bác sĩ chuyên môn cao, tận tâm vì nụ
                cười của bạn.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/booking')}
                  className={BTN_PRIMARY_LG}
                >
                  Đặt lịch ngay <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href={`tel:${CLINIC_CONTACT.hotline.replace(/\s/g, '')}`}
                  className={BTN_SECONDARY}
                >
                  <Phone className="w-4 h-4" /> {CLINIC_CONTACT.hotline}
                </a>
              </div>

              <div className="pt-6 flex items-center gap-4 justify-center lg:justify-start">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map((i) => (
                    <img
                      key={i}
                      className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm"
                      src={`https://i.pravatar.cc/100?img=${i}`}
                      alt={`Khách hàng ${i}`}
                      loading="lazy"
                      decoding="async"
                    />
                  ))}
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shadow-sm">
                    5k+
                  </div>
                </div>
                <div className="text-sm">
                  <div className="flex text-amber-400" aria-label="5 sao">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <span className="text-slate-500">Từ 5,000+ khách hàng</span>
                </div>
              </div>
            </div>

            <div className="relative w-full max-w-lg mx-auto lg:ml-auto">
              <div className="relative rounded-3xl overflow-hidden aspect-[4/5] shadow-2xl shadow-blue-500/10 ring-1 ring-slate-200/50">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent z-10" />
                <img
                  src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=800&auto=format&fit=crop"
                  alt="Bác sĩ nha khoa"
                  className="w-full h-full object-cover"
                  loading="eager"
                  fetchpriority="high"
                  decoding="async"
                />
              </div>

              <div
                className="absolute bottom-4 left-4 sm:-bottom-6 sm:-left-6 bg-white/95 backdrop-blur p-4 rounded-2xl shadow-xl z-20 flex items-center gap-4 ring-1 ring-slate-100"
              >
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 text-2xl">
                  👍
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-lg leading-none">
                    100%
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-1">
                    Khách hàng hài lòng
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-blue-600 py-10 md:py-12">
        <div className={CONTAINER}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-8 gap-x-4 text-center lg:divide-x lg:divide-blue-500/40">
            {HERO_STATS.map((stat) => (
              <div key={stat.label} className="space-y-1 lg:px-4">
                <div className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                  {stat.value}
                </div>
                <div className="text-blue-100 text-sm font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default HeroSection;
