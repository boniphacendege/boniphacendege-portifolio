import React, { useState } from 'react';
import { PORTFOLIO_DATA } from '../data/portfolioData';
import { Calculator, Clock, DollarSign, Send, CheckCircle2, Sparkles } from 'lucide-react';

interface EstimatorProps {
  onPreFillContact: (subject: string, message: string) => void;
}

export const Estimator: React.FC<EstimatorProps> = ({ onPreFillContact }) => {
  const [selectedType, setSelectedType] = useState<string>('mvp');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(['auth', 'payments']);

  const toggleFeature = (id: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const projectType = PORTFOLIO_DATA.estimatorOptions.projectTypes.find((p) => p.id === selectedType);

  const handleTransferToContact = () => {
    const selectedFeatureNames = PORTFOLIO_DATA.estimatorOptions.features
      .filter((f) => selectedFeatures.includes(f.id))
      .map((f) => f.name)
      .join(', ');

    const subject = `Project Inquiry: ${projectType?.name}`;
    const message = `Hello Boniphace,\n\nI used your interactive project estimator and would like to discuss a project:\n\n• Project Scope: ${projectType?.name}\n• Estimated Timeline: ${projectType?.duration}\n• Target Features: ${selectedFeatureNames || 'Standard Core Features'}\n\nLet's connect to review requirements and scheduling.\n\nBest regards,`;

    onPreFillContact(subject, message);
  };

  return (
    <section id="estimator" className="py-20 relative bg-[#010904]/70 border-t border-[rgba(240,185,46,0.18)]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="max-w-2xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold text-[#f0b92e] bg-[#f0b92e]/10 border border-[#f0b92e]/25 mb-3">
            <Calculator className="w-3.5 h-3.5 text-[#f0b92e]" />
            <span>INTERACTIVE TOOL</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-serif-heading mb-4 gold-text">
            Project scope & timeline estimator
          </h2>
          <p className="text-base sm:text-lg text-[#9fbfae]">
            Planning a new digital product or cloud migration? Configure your target scope to view estimated delivery velocity.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Configuration Form */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Project Type */}
            <div className="p-6 rounded-2xl bg-[#02140b] card-neon-shallow shadow-xl">
              <label className="text-xs font-mono font-bold text-[#f0b92e] uppercase tracking-wider block mb-3">
                1. Select Core Archetype
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PORTFOLIO_DATA.estimatorOptions.projectTypes.map((pt) => {
                  const isSelected = selectedType === pt.id;
                  return (
                    <button
                      key={pt.id}
                      onClick={() => setSelectedType(pt.id)}
                      className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#0f7a43]/30 border-[#3dff8f] shadow-[0_0_15px_-3px_rgba(61,255,143,0.3)]'
                          : 'bg-[#010a05] border-[rgba(240,185,46,0.15)] hover:border-[#f0b92e]/40'
                      }`}
                    >
                      <div className="font-bold text-sm text-[#fff1b8] mb-1">
                        {pt.name}
                      </div>
                      <div className="text-xs text-[#3dff8f] font-mono">
                        ~{pt.duration}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Add-on Capabilities */}
            <div className="p-6 rounded-2xl bg-[#02140b] card-neon-shallow shadow-xl">
              <label className="text-xs font-mono font-bold text-[#f0b92e] uppercase tracking-wider block mb-3">
                2. Select Key Features & Integrations
              </label>
              <div className="space-y-2.5">
                {PORTFOLIO_DATA.estimatorOptions.features.map((feat) => {
                  const isChecked = selectedFeatures.includes(feat.id);
                  return (
                    <div
                      key={feat.id}
                      onClick={() => toggleFeature(feat.id)}
                      className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-[#0a351e]/40 border-[#3dff8f]'
                          : 'bg-[#010a05] border-[rgba(240,185,46,0.15)] hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                            isChecked
                              ? 'bg-[#3dff8f] border-[#3dff8f] text-[#041c10]'
                              : 'border-[rgba(240,185,46,0.4)] bg-transparent'
                          }`}
                        >
                          {isChecked && <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />}
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-[#f4fff8]">
                          {feat.name}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-[#9fbfae]">
                        {feat.cost}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Results Summary Card */}
          <div className="lg:col-span-5 p-7 rounded-[22px] bg-gradient-to-br from-[#0f7a43]/30 via-[#03170d] to-[#010703] card-neon-shallow shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[rgba(240,185,46,0.2)]">
              <div>
                <span className="text-xs font-mono text-[#3dff8f] uppercase tracking-wider">
                  Scope Overview
                </span>
                <h3 className="text-xl font-bold font-serif-heading text-[#fff1b8]">
                  {projectType?.name}
                </h3>
              </div>
              <Sparkles className="w-5 h-5 text-[#f0b92e]" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#010a05]/80 border border-white/5">
                <div className="flex items-center gap-1.5 text-xs text-[#9fbfae] mb-1">
                  <Clock className="w-3.5 h-3.5 text-[#3dff8f]" />
                  <span>Timeline</span>
                </div>
                <div className="text-lg font-bold font-mono text-[#3dff8f]">
                  {projectType?.duration}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[#010a05]/80 border border-white/5">
                <div className="flex items-center gap-1.5 text-xs text-[#9fbfae] mb-1">
                  <DollarSign className="w-3.5 h-3.5 text-[#f0b92e]" />
                  <span>Ballpark Guide</span>
                </div>
                <div className="text-lg font-bold font-mono text-[#f0b92e]">
                  {projectType?.baseEst}
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs font-mono text-[#9fbfae] mb-2 uppercase">
                Included Features ({selectedFeatures.length}):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedFeatures.length === 0 ? (
                  <span className="text-xs text-[#9fbfae]/70 italic">None selected</span>
                ) : (
                  PORTFOLIO_DATA.estimatorOptions.features
                    .filter((f) => selectedFeatures.includes(f.id))
                    .map((f) => (
                      <span
                        key={f.id}
                        className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#3dff8f]/10 text-[#3dff8f] border border-[#3dff8f]/20"
                      >
                        {f.name}
                      </span>
                    ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-[rgba(240,185,46,0.2)]">
              <button
                onClick={handleTransferToContact}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-full font-bold text-sm text-[#1a1200] bg-gradient-to-b from-[#fff1b8] via-[#f0b92e] to-[#b8841a] hover:from-white hover:to-[#f0b92e] shadow-lg shadow-[#f0b92e]/20 active:scale-98 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4 text-[#1a1200]" />
                <span>Inquire About This Scope</span>
              </button>
              <p className="text-[11px] text-[#9fbfae] text-center mt-2 font-mono">
                Transfers this configuration directly into the contact form.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
