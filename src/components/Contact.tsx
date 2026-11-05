import React, { useState, useEffect } from 'react';
import { ProfileData, ServiceItem, portfolioStorage } from '../data/portfolioStorage';
import { LOGO_DATA_URI } from '../assets/logo';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle,
  Copy,
  ExternalLink,
  MessageSquare,
  Clock,
  DollarSign,
  ShieldCheck,
  Briefcase,
  Facebook,
  Linkedin,
  Instagram,
  Github
} from 'lucide-react';
import { GoogleLocationIcon } from './GoogleLocationIcon';

interface ContactProps {
  profile: ProfileData;
  services: ServiceItem[];
  preSelectedService?: string;
  preFilledSubject?: string;
  preFilledMessage?: string;
  onOpenMap?: () => void;
}

export const Contact: React.FC<ContactProps> = ({
  profile,
  services,
  preSelectedService = '',
  preFilledSubject = '',
  preFilledMessage = '',
  onOpenMap
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    serviceRequired: preSelectedService || 'Graphic Design & Branding',
    budgetRange: '',
    preferredTimeline: '',
    message: preFilledMessage,
    // Honeypot for spam bot detection
    websiteHoneypot: ''
  });

  const [copiedEmail, setCopiedEmail] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (preSelectedService) {
      setFormData((prev) => ({ ...prev, serviceRequired: preSelectedService }));
    }
  }, [preSelectedService]);

  useEffect(() => {
    if (preFilledMessage) {
      setFormData((prev) => ({ ...prev, message: preFilledMessage }));
    }
  }, [preFilledMessage]);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(profile.email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check honeypot to reject bot spam silently
    if (formData.websiteHoneypot) {
      setSubmitted(true);
      return;
    }

    setIsSubmitting(true);

    // Save inquiry to persistent portfolioStorage so Boniphace can review it in the Admin Dashboard!
    portfolioStorage.recordInquiry({
      name: formData.name,
      email: formData.email,
      organization: formData.organization || undefined,
      serviceRequired: formData.serviceRequired,
      budgetRange: formData.budgetRange || undefined,
      preferredTimeline: formData.preferredTimeline || undefined,
      message: formData.message
    });

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 400);
  };

  const mailtoLink = `mailto:${profile.email}?subject=${encodeURIComponent(
    `Project Inquiry: ${formData.serviceRequired} - ${formData.name}`
  )}&body=${encodeURIComponent(
    `Client Name: ${formData.name}\nEmail: ${formData.email}\nOrganization: ${formData.organization || 'N/A'}\nService Required: ${formData.serviceRequired}\nBudget Range: ${formData.budgetRange || 'Flexible'}\nTimeline: ${formData.preferredTimeline || 'Flexible'}\n\nProject Details:\n${formData.message}`
  )}`;

  return (
    <section id="contact" className="py-20 relative">
      <div className="w-full max-w-[1740px] 2xl:max-w-[1860px] mx-auto px-2.5 sm:px-4 md:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mb-12 stagger-child">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold text-[#f0b92e] bg-[#f0b92e]/10 border border-[#f0b92e]/25 mb-3">
            <Send className="w-3.5 h-3.5 text-[#f0b92e]" />
            <span>GET IN TOUCH / HIRE ME</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-serif-heading mb-4 gold-text">
            Let’s create something exceptional
          </h2>
          <p className="text-base sm:text-lg text-[#9fbfae]">
            Have a branding concept, website project, or digital content brief in mind? Fill in the details below, and I will get back to you promptly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Direct Contact Info */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-7 rounded-[22px] bg-gradient-to-br from-[#0f7a43]/20 via-[#03170d] to-[#010703] card-neon-shallow shadow-xl space-y-6 stagger-child">
              {/* Brand Profile Quick Info & Status */}
              <div className="flex items-center gap-3.5 pb-4 border-b border-[rgba(240,185,46,0.2)]">
                <div className="w-12 h-12 rounded-xl overflow-hidden p-0.5 bg-gradient-to-br from-[#f0b92e] to-[#0f7a43] shrink-0 shadow-[0_0_12px_rgba(61,255,143,0.3)] flex items-center justify-center bg-[#010a05]">
                  <img
                    src={profile.logoPhoto || LOGO_DATA_URI}
                    alt={profile.name}
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
                <div>
                  <div className="font-serif-heading font-extrabold text-base text-[#fff1b8] leading-tight">
                    {profile.name}
                  </div>
                  <div className="text-xs text-[#3dff8f] font-mono flex items-center gap-1.5 mt-1">
                    <span className="w-2 h-2 rounded-full bg-[#3dff8f] animate-pulse" />
                    <span>Available for Projects</span>
                  </div>
                  <div className="text-xs text-[#9fbfae] font-mono mt-0.5">
                    {profile.location || 'Dodoma CBD Tanzania'}
                  </div>
                </div>
              </div>

              {/* Email item */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#0a351e] border border-[#3dff8f]/30 flex items-center justify-center shrink-0 text-[#3dff8f]">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-mono font-bold text-[#f0b92e] uppercase">
                    Direct Email
                  </div>
                  <a
                    href={`mailto:${profile.email}`}
                    className="text-sm sm:text-base text-[#f4fff8] font-medium hover:text-[#3dff8f] transition-colors break-all block mt-0.5"
                  >
                    {profile.email}
                  </a>
                  <button
                    onClick={handleCopyEmail}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs text-[#9fbfae] hover:text-[#3dff8f] font-mono cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedEmail ? 'Copied to clipboard!' : 'Copy email address'}</span>
                  </button>
                </div>
              </div>

              {/* Phone & WhatsApp */}
              <div className="flex items-start gap-4 pt-4 border-t border-[rgba(240,185,46,0.15)]">
                <div className="w-12 h-12 rounded-xl bg-[#0a351e] border border-[#3dff8f]/30 flex items-center justify-center shrink-0 text-[#3dff8f]">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-mono font-bold text-[#f0b92e] uppercase">
                    Phone & WhatsApp
                  </div>
                  <div className="text-sm sm:text-base text-[#f4fff8] font-medium mt-0.5">
                    {profile.phone}
                  </div>
                  <a
                    href={`https://wa.me/${profile.whatsapp}?text=Hello%20Boniphace,%20I%20am%20interested%20in%20your%20creative%20services`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-xs text-[#3dff8f] hover:underline font-mono"
                  >
                    <span>Message on WhatsApp</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-4 pt-4 border-t border-[rgba(240,185,46,0.15)]">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenMap) {
                      onOpenMap();
                    } else {
                      window.open('https://www.google.com/maps/search/?api=1&query=Dodoma+CBD+Tanzania', '_blank', 'noopener,noreferrer');
                    }
                  }}
                  className="w-12 h-12 rounded-xl bg-[#0a351e] border border-[#3dff8f]/40 hover:border-[#3dff8f] flex items-center justify-center shrink-0 cursor-pointer group transition-all shadow-sm hover:shadow-[0_0_8px_rgba(61,255,143,0.2)] select-none"
                  title="Click to show Dodoma CBD in Google GPS map"
                  aria-label="Show Dodoma CBD on Google GPS Map"
                >
                  <GoogleLocationIcon className="w-5 h-6" />
                </button>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-mono font-bold text-[#f0b92e] uppercase">
                      Location
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenMap) {
                          onOpenMap();
                        } else {
                          window.open('https://www.google.com/maps/search/?api=1&query=Dodoma+CBD+Tanzania', '_blank', 'noopener,noreferrer');
                        }
                      }}
                      className="inline-flex items-center gap-1 text-[11px] text-[#3dff8f] hover:underline font-mono cursor-pointer"
                    >
                      <span>Show Google GPS Map</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-sm sm:text-base text-[#f4fff8] font-medium mt-0.5">
                    {profile.location || 'Dodoma CBD Tanzania'}
                  </div>
                  <div className="text-xs text-[#9fbfae] mt-1 font-mono">
                    Dodoma CBD, Tanzania · GPS: -6.1731° S, 35.7419° E (UTC+3)
                  </div>
                </div>
              </div>

              {/* Social Channels */}
              <div className="pt-4 border-t border-[rgba(240,185,46,0.15)]">
                <div className="text-xs font-mono font-bold text-[#f0b92e] uppercase mb-2.5">
                  Connect on Social Media
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  {profile.socialLinks?.facebook && (
                    <a
                      href={profile.socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#02140b] border border-[#3dff8f]/50 hover:border-[#3dff8f] text-xs font-mono text-[#f4fff8] hover:text-[#3dff8f] hover:bg-[#032a14] shadow-[0_0_8px_rgba(61,255,143,0.25)] hover:shadow-[0_0_15px_rgba(61,255,143,0.6)] hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
                      aria-label="Facebook profile"
                    >
                      <span className="w-6 h-6 rounded-full shining-narrow-neon-btn shrink-0" style={{ animationDelay: '0s' }}>
                        <Facebook className="w-3.5 h-3.5" />
                      </span>
                      <span className="font-semibold text-xs">Facebook</span>
                    </a>
                  )}
                  {profile.socialLinks?.linkedin && (
                    <a
                      href={profile.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#02140b] border border-[#3dff8f]/50 hover:border-[#3dff8f] text-xs font-mono text-[#f4fff8] hover:text-[#3dff8f] hover:bg-[#032a14] shadow-[0_0_8px_rgba(61,255,143,0.25)] hover:shadow-[0_0_15px_rgba(61,255,143,0.6)] hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
                      aria-label="LinkedIn profile"
                    >
                      <span className="w-6 h-6 rounded-full shining-narrow-neon-btn shrink-0" style={{ animationDelay: '0.4s' }}>
                        <Linkedin className="w-3.5 h-3.5" />
                      </span>
                      <span className="font-semibold text-xs">LinkedIn</span>
                    </a>
                  )}
                  {profile.socialLinks?.instagram && (
                    <a
                      href={profile.socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#02140b] border border-[#3dff8f]/50 hover:border-[#3dff8f] text-xs font-mono text-[#f4fff8] hover:text-[#3dff8f] hover:bg-[#032a14] shadow-[0_0_8px_rgba(61,255,143,0.25)] hover:shadow-[0_0_15px_rgba(61,255,143,0.6)] hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
                      aria-label="Instagram profile"
                    >
                      <span className="w-6 h-6 rounded-full shining-narrow-neon-btn shrink-0" style={{ animationDelay: '0.8s' }}>
                        <Instagram className="w-3.5 h-3.5" />
                      </span>
                      <span className="font-semibold text-xs">Instagram</span>
                    </a>
                  )}
                  {profile.socialLinks?.github && (
                    <a
                      href={profile.socialLinks.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#02140b] border border-[#3dff8f]/50 hover:border-[#3dff8f] text-xs font-mono text-[#f4fff8] hover:text-[#3dff8f] hover:bg-[#032a14] shadow-[0_0_8px_rgba(61,255,143,0.25)] hover:shadow-[0_0_15px_rgba(61,255,143,0.6)] hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
                      aria-label="GitHub profile"
                    >
                      <span className="w-6 h-6 rounded-full shining-narrow-neon-btn shrink-0" style={{ animationDelay: '1.2s' }}>
                        <Github className="w-3.5 h-3.5" />
                      </span>
                      <span className="font-semibold text-xs">GitHub</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Guarantees */}
            <div className="p-5 rounded-2xl bg-[#021208] card-neon-shallow text-xs text-[#9fbfae] space-y-2 stagger-child">
              <div className="flex items-center gap-2 text-[#fff1b8] font-bold">
                <ShieldCheck className="w-4 h-4 text-[#3dff8f]" />
                <span>What Happens Next:</span>
              </div>
              <p className="leading-relaxed">
                1. I review your creative brief and technical scope.<br />
                2. I respond within 24 hours with questions, timeline options, or a proposal.<br />
                3. We schedule an introductory video/audio call or text chat.
              </p>
            </div>
          </div>

          {/* Right Column: Contact & Hire Me Form */}
          <div className="lg:col-span-7">
            <div className="p-7 sm:p-9 rounded-[22px] bg-[#02130a] card-neon-shallow shadow-2xl stagger-child">
              {submitted ? (
                <div className="py-12 flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-[#0f7a43]/30 border-2 border-[#3dff8f] flex items-center justify-center text-[#3dff8f]">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold font-serif-heading text-[#fff1b8]">
                    Inquiry Received & Prepared!
                  </h3>
                  <p className="text-sm text-[#9fbfae] max-w-md">
                    Thank you, <strong className="text-white">{formData.name}</strong>. Your inquiry for <strong className="text-[#3dff8f]">{formData.serviceRequired}</strong> has been logged. You can also send this directly via your email client below.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <a
                      href={mailtoLink}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-sm text-[#1a1200] bg-gradient-to-b from-[#fff1b8] via-[#f0b92e] to-[#b8841a] hover:from-white hover:to-[#f0b92e]"
                    >
                      <Send className="w-4 h-4 text-[#1a1200]" />
                      <span>Launch Email Client</span>
                    </a>
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setFormData({
                          name: '',
                          email: '',
                          organization: '',
                          serviceRequired: services[0]?.title || 'Graphic Design',
                          budgetRange: '',
                          preferredTimeline: '',
                          message: '',
                          websiteHoneypot: ''
                        });
                      }}
                      className="px-5 py-3 rounded-full text-xs font-mono text-[#9fbfae] border border-white/20 hover:text-white cursor-pointer"
                    >
                      Send Another Message
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Honeypot field (hidden from real users, traps spam bots) */}
                  <input
                    type="text"
                    name="website_url_honeypot"
                    value={formData.websiteHoneypot}
                    onChange={(e) => setFormData({ ...formData, websiteHoneypot: e.target.value })}
                    className="hidden"
                    tabIndex={-1}
                    autoComplete="off"
                  />

                  {/* Name and Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-mono text-[#9fbfae] block mb-1.5">
                        Your Name *
                      </label>
                      <input
                        required
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Alex Mhando"
                        className="w-full px-4 py-3 rounded-xl bg-[#010904] border border-[rgba(240,185,46,0.25)] text-[#f4fff8] text-sm focus:border-[#3dff8f] focus:outline-none focus:ring-1 focus:ring-[#3dff8f] transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-mono text-[#9fbfae] block mb-1.5">
                        Email Address *
                      </label>
                      <input
                        required
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="alex@company.com"
                        className="w-full px-4 py-3 rounded-xl bg-[#010904] border border-[rgba(240,185,46,0.25)] text-[#f4fff8] text-sm focus:border-[#3dff8f] focus:outline-none focus:ring-1 focus:ring-[#3dff8f] transition-all"
                      />
                    </div>
                  </div>

                  {/* Organization & Service Required */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-mono text-[#9fbfae] block mb-1.5">
                        Organization / Brand (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.organization}
                        onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                        placeholder="e.g. Serengeti Ventures"
                        className="w-full px-4 py-3 rounded-xl bg-[#010904] border border-[rgba(240,185,46,0.25)] text-[#f4fff8] text-sm focus:border-[#3dff8f] focus:outline-none focus:ring-1 focus:ring-[#3dff8f] transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-mono text-[#9fbfae] block mb-1.5">
                        Service Required *
                      </label>
                      <select
                        required
                        value={formData.serviceRequired}
                        onChange={(e) => setFormData({ ...formData, serviceRequired: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-[#010904] border border-[rgba(240,185,46,0.25)] text-[#f4fff8] text-sm focus:border-[#3dff8f] focus:outline-none focus:ring-1 focus:ring-[#3dff8f] transition-all cursor-pointer"
                      >
                        {services.map((s) => (
                          <option key={s.id} value={s.title} className="bg-[#010904] text-white">
                            {s.title}
                          </option>
                        ))}
                        <option value="General Consultation" className="bg-[#010904] text-white">
                          General Consultation / Other
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* Budget & Timeline */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-mono text-[#9fbfae] block mb-1.5">
                        Budget Range (Optional)
                      </label>
                      <select
                        value={formData.budgetRange}
                        onChange={(e) => setFormData({ ...formData, budgetRange: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-[#010904] border border-[rgba(240,185,46,0.25)] text-[#f4fff8] text-sm focus:border-[#3dff8f] focus:outline-none focus:ring-1 focus:ring-[#3dff8f] transition-all cursor-pointer"
                      >
                        <option value="" className="bg-[#010904] text-white">Select budget (optional)</option>
                        <option value="Under $500" className="bg-[#010904] text-white">Under $500</option>
                        <option value="$500 - $1,500" className="bg-[#010904] text-white">$500 - $1,500</option>
                        <option value="$1,500 - $3,500" className="bg-[#010904] text-white">$1,500 - $3,500</option>
                        <option value="$3,500+" className="bg-[#010904] text-white">$3,500+</option>
                        <option value="Flexible / To discuss" className="bg-[#010904] text-white">Flexible / To discuss</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-mono text-[#9fbfae] block mb-1.5">
                        Preferred Timeline (Optional)
                      </label>
                      <select
                        value={formData.preferredTimeline}
                        onChange={(e) => setFormData({ ...formData, preferredTimeline: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-[#010904] border border-[rgba(240,185,46,0.25)] text-[#f4fff8] text-sm focus:border-[#3dff8f] focus:outline-none focus:ring-1 focus:ring-[#3dff8f] transition-all cursor-pointer"
                      >
                        <option value="" className="bg-[#010904] text-white">Select timeline (optional)</option>
                        <option value="Urgent (1-2 weeks)" className="bg-[#010904] text-white">Urgent (1-2 weeks)</option>
                        <option value="Standard (2-4 weeks)" className="bg-[#010904] text-white">Standard (2-4 weeks)</option>
                        <option value="Flexible (1-2 months)" className="bg-[#010904] text-white">Flexible (1-2 months)</option>
                      </select>
                    </div>
                  </div>

                  {/* Project Description Message */}
                  <div>
                    <label className="text-xs font-mono text-[#9fbfae] block mb-1.5">
                      Project Description *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Please share details about your visual design, branding, or website project goals..."
                      className="w-full px-4 py-3 rounded-xl bg-[#010904] border border-[rgba(240,185,46,0.25)] text-[#f4fff8] text-sm focus:border-[#3dff8f] focus:outline-none focus:ring-1 focus:ring-[#3dff8f] transition-all"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm text-[#1a1200] bg-gradient-to-b from-[#fff1b8] via-[#f0b92e] to-[#b8841a] hover:from-white hover:to-[#f0b92e] shadow-lg shadow-[#f0b92e]/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-4 h-4 text-[#1a1200]" />
                      <span>{isSubmitting ? 'Sending...' : 'Send Inquiry / Hire Me'}</span>
                    </button>
                    <span className="text-xs font-mono text-[#9fbfae]">
                      Logged to inbox with instant email client launcher
                    </span>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
