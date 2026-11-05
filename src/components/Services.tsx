import React, { useState } from 'react';
import { ServiceItem } from '../data/portfolioStorage';
import {
  Palette,
  Layout,
  Code2,
  FileImage,
  Sparkles,
  Wrench,
  CheckCircle2,
  ArrowRight,
  Clock,
  Tag
} from 'lucide-react';

interface ServicesProps {
  services: ServiceItem[];
  onRequestService: (serviceTitle: string) => void;
}

export const Services: React.FC<ServicesProps> = ({ services, onRequestService }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const publishedServices = services.filter((s) => s.published);

  const categories = ['all', ...Array.from(new Set(publishedServices.map((s) => s.category)))];

  const filteredServices = publishedServices.filter((s) => {
    if (selectedCategory === 'all') return true;
    return s.category === selectedCategory;
  });

  const getServiceIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('logo') || t.includes('identity')) return <Palette className="w-5 h-5 text-[#f0b92e]" />;
    if (t.includes('flyer') || t.includes('poster') || t.includes('social')) return <FileImage className="w-5 h-5 text-[#3dff8f]" />;
    if (t.includes('design') && t.includes('web')) return <Layout className="w-5 h-5 text-[#f0b92e]" />;
    if (t.includes('develop') || t.includes('landing')) return <Code2 className="w-5 h-5 text-[#3dff8f]" />;
    if (t.includes('ai') || t.includes('assisted')) return <Sparkles className="w-5 h-5 text-[#f0b92e]" />;
    if (t.includes('maintenance')) return <Wrench className="w-5 h-5 text-[#3dff8f]" />;
    return <Palette className="w-5 h-5 text-[#f0b92e]" />;
  };

  return (
    <section id="services" className="py-20 relative">
      <div className="w-full max-w-[1740px] 2xl:max-w-[1860px] mx-auto px-2.5 sm:px-4 md:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 stagger-child">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold text-[#3dff8f] bg-[#3dff8f]/10 border border-[#3dff8f]/25 mb-3">
              <Palette className="w-3.5 h-3.5 text-[#3dff8f]" />
              <span>CREATIVE & DIGITAL SERVICES</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-serif-heading mb-4 gold-text">
              Services & creative solutions
            </h2>
            <p className="text-base sm:text-lg text-[#9fbfae]">
              Professional visual design, bespoke modern websites, and digital content creation tailored to your unique objectives.
            </p>
          </div>

          {/* Category Filter */}
          {categories.length > 2 && (
            <div className="flex flex-wrap gap-2 stagger-child">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#3dff8f]/15 text-[#3dff8f] border border-[#3dff8f]'
                      : 'text-[#9fbfae] border border-[rgba(240,185,46,0.2)] hover:border-[#3dff8f]/40 hover:text-white'
                  }`}
                >
                  {cat === 'all' ? 'All Services' : cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="p-7 rounded-[22px] bg-gradient-to-br from-[#0f7a43]/20 via-[#03170d]/85 to-[#010703] card-neon-shallow transition-all duration-300 flex flex-col justify-between group stagger-child"
            >
              <div>
                {/* Top Row: Icon & Category */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-[#02180d] border border-[rgba(240,185,46,0.3)] flex items-center justify-center group-hover:border-[#3dff8f] group-hover:scale-105 transition-all">
                    {getServiceIcon(service.title)}
                  </div>
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#0a351e] text-[#3dff8f] border border-[#3dff8f]/20">
                    {service.category}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold font-serif-heading text-[#fff1b8] group-hover:text-[#3dff8f] transition-colors mb-2.5">
                  {service.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-[#9fbfae] leading-relaxed mb-6">
                  {service.description}
                </p>
              </div>

              <div>
                {/* Optional metadata (price/delivery) */}
                {(service.price || service.deliveryEstimate) && (
                  <div className="py-2.5 px-3.5 rounded-xl bg-[#010a05] border border-white/5 mb-4 flex items-center justify-between text-xs text-[#9fbfae] font-mono">
                    {service.price && (
                      <span className="flex items-center gap-1 text-[#f0b92e]">
                        <Tag className="w-3.5 h-3.5" />
                        {service.price}
                      </span>
                    )}
                    {service.deliveryEstimate && (
                      <span className="flex items-center gap-1 text-[#3dff8f]">
                        <Clock className="w-3.5 h-3.5" />
                        {service.deliveryEstimate}
                      </span>
                    )}
                  </div>
                )}

                {/* Action Row */}
                <div className="pt-4 border-t border-[rgba(240,185,46,0.18)] flex items-center justify-between">
                  <span className="text-xs font-mono text-[#9fbfae] flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#3dff8f]" />
                    {service.availability}
                  </span>
                  <button
                    onClick={() => onRequestService(service.title)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#f0b92e] group-hover:text-white hover:underline cursor-pointer"
                  >
                    <span>Request Service</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#3dff8f]" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
