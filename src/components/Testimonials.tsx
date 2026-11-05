import React from 'react';
import { TestimonialItem } from '../data/portfolioStorage';
import { Quote, Star, CheckCircle, ShieldAlert, MessageSquare, PlusCircle } from 'lucide-react';

interface TestimonialsProps {
  testimonials: TestimonialItem[];
  onOpenAdmin: () => void;
}

export const Testimonials: React.FC<TestimonialsProps> = ({ testimonials, onOpenAdmin }) => {
  const publishedTestimonials = testimonials.filter(
    (t) => t.published && t.permissionToPublish
  );

  return (
    <section id="testimonials" className="py-20 relative bg-[#010804]/50">
      <div className="w-full max-w-[1740px] 2xl:max-w-[1860px] mx-auto px-2.5 sm:px-4 md:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mb-12 stagger-child">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold text-[#f0b92e] bg-[#f0b92e]/10 border border-[#f0b92e]/25 mb-3">
            <MessageSquare className="w-3.5 h-3.5 text-[#f0b92e]" />
            <span>CLIENT ENDORSEMENTS & REVIEWS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-serif-heading mb-4 gold-text">
            Client feedback & reviews
          </h2>
          <p className="text-base sm:text-lg text-[#9fbfae]">
            Authentic words from clients and collaborators. Every testimonial is displayed with explicit permission.
          </p>
        </div>

        {publishedTestimonials.length === 0 ? (
          /* Honest, professional empty state adhering to "do not invent people or testimonials" */
          <div className="p-8 sm:p-12 rounded-3xl bg-[#02130a] card-neon-shallow text-center max-w-3xl mx-auto space-y-4 shadow-xl stagger-child">
            <div className="w-12 h-12 rounded-2xl bg-[#0a351e] text-[#f0b92e] flex items-center justify-center mx-auto">
              <Quote className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-serif-heading text-[#fff1b8]">
              Testimonials are Published Upon Explicit Client Authorization
            </h3>
            <p className="text-sm text-[#9fbfae] leading-relaxed max-w-xl mx-auto">
              I uphold a strict policy of honesty and privacy. Only verified, authorized client feedback is showcased here. If you are a client wishing to provide an endorsement, or a prospective partner requesting references, feel free to get in touch.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <a
                href="#contact"
                className="px-5 py-2.5 rounded-full text-xs font-bold text-[#1a1200] bg-gradient-to-b from-[#fff1b8] via-[#f0b92e] to-[#b8841a] hover:from-white hover:to-[#f0b92e]"
              >
                Request References
              </a>
              <button
                type="button"
                data-unauth-exempt="true"
                data-admin-portal="true"
                data-admin-trigger="true"
                onClick={onOpenAdmin}
                className="px-5 py-2.5 rounded-full text-xs font-mono text-[#3dff8f] border border-[#3dff8f]/40 hover:bg-[#3dff8f]/10 cursor-pointer"
              >
                Add Verified Testimonial (Admin)
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {publishedTestimonials.map((t) => (
              <div
                key={t.id}
                className="p-7 rounded-[22px] bg-gradient-to-br from-[#0f7a43]/20 via-[#03170d]/85 to-[#010703] card-neon-shallow transition-all flex flex-col justify-between group shadow-xl stagger-child"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-1 text-[#f0b92e]">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-[#f0b92e]" />
                      ))}
                    </div>
                    <Quote className="w-6 h-6 text-[#3dff8f]/40 group-hover:text-[#3dff8f] transition-colors" />
                  </div>
                  <p className="text-sm text-[#f4fff8]/90 leading-relaxed italic mb-6">
                    "{t.content}"
                  </p>
                </div>

                <div className="pt-4 border-t border-[rgba(240,185,46,0.18)] flex items-center gap-3">
                  {t.avatar ? (
                    <img
                      src={t.avatar}
                      alt={t.name}
                      className="w-11 h-11 rounded-full object-cover border border-[#f0b92e]/40"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-[#0a351e] text-[#f0b92e] font-serif-heading font-bold flex items-center justify-center border border-[#f0b92e]/30">
                      {t.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-sm text-[#fff1b8] flex items-center gap-1.5">
                      <span>{t.name}</span>
                      <CheckCircle className="w-3.5 h-3.5 text-[#3dff8f]" />
                    </div>
                    <div className="text-xs text-[#9fbfae]">
                      {t.role} {t.organization && `· ${t.organization}`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
