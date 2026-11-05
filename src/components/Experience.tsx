import React, { useState } from 'react';
import {
  WorkExperienceItem,
  EducationItem,
  CertificationItem,
  AchievementItem
} from '../data/portfolioStorage';
import {
  Briefcase,
  GraduationCap,
  Award,
  Trophy,
  Calendar,
  MapPin,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

interface ExperienceProps {
  workExperience: WorkExperienceItem[];
  education: EducationItem[];
  certifications: CertificationItem[];
  achievements: AchievementItem[];
  onOpenAdmin: () => void;
}

export const Experience: React.FC<ExperienceProps> = ({
  workExperience,
  education,
  certifications,
  achievements,
  onOpenAdmin
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'work' | 'education' | 'certs'>('all');

  const publishedWork = workExperience.filter((w) => w.published);
  const publishedEdu = education.filter((e) => e.published);
  const publishedCerts = certifications.filter((c) => c.published);
  const publishedAch = achievements.filter((a) => a.published);

  return (
    <section id="experience" className="py-20 relative">
      <div className="w-full max-w-[1740px] 2xl:max-w-[1860px] mx-auto px-2.5 sm:px-4 md:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mb-12 stagger-child">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold text-[#f0b92e] bg-[#f0b92e]/10 border border-[#f0b92e]/25 mb-3">
            <Briefcase className="w-3.5 h-3.5 text-[#f0b92e]" />
            <span>BACKGROUND & QUALIFICATIONS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-serif-heading mb-4 gold-text">
            Experience, education & achievements
          </h2>
          <p className="text-base sm:text-lg text-[#9fbfae]">
            An authentic record of my freelance creative services, practical collaborations, design education, and verified achievements.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Work Experience Timeline */}
          <div className="lg:col-span-7 space-y-8">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(240,185,46,0.2)] stagger-child">
              <h3 className="text-xl font-bold font-serif-heading text-[#fff1b8] flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#3dff8f]" />
                <span>Work & Freelance Experience</span>
              </h3>
              <span className="text-xs font-mono text-[#9fbfae]">
                {publishedWork.length} Entries
              </span>
            </div>

            <div className="relative border-l-2 border-[rgba(240,185,46,0.25)] ml-4 sm:ml-5 pl-6 sm:pl-8 space-y-8">
              {publishedWork.map((item) => (
                <div key={item.id} className="relative group stagger-child">
                  {/* Dot Connector */}
                  <div className="absolute -left-[31px] sm:-left-[39px] top-5 w-3.5 h-3.5 rounded-full bg-[#f0b92e] shadow-[0_0_14px_#f0b92e] border-2 border-[#041c10] group-hover:scale-125 transition-transform" />

                  {/* Card */}
                  <div className="p-6 rounded-[22px] bg-gradient-to-br from-[#0f7a43]/20 via-[#03170d]/85 to-[#010703] card-neon-shallow transition-all shadow-lg">
                    {/* Period & Employment Type */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#3dff8f]">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{item.startDate} – {item.current ? 'Present' : item.endDate}</span>
                      </div>
                      <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-[#f0b92e]/15 text-[#fff1b8] border border-[#f0b92e]/30">
                        {item.employmentType}
                      </span>
                    </div>

                    {/* Role Title */}
                    <h4 className="text-lg sm:text-xl font-bold font-serif-heading text-[#fff1b8] group-hover:text-[#3dff8f] transition-colors mb-1">
                      {item.roleTitle}
                    </h4>

                    {/* Employer / Client & Location */}
                    <div className="text-xs sm:text-sm font-semibold text-[#f0b92e] mb-3 flex items-center gap-2">
                      <span>{item.employer}</span>
                      {item.location && (
                        <>
                          <span className="text-white/30">•</span>
                          <span className="text-xs text-[#9fbfae] font-normal flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#9fbfae]" />
                            {item.location}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-[#9fbfae] leading-relaxed mb-4">
                      {item.description}
                    </p>

                    {/* Responsibilities list */}
                    {item.responsibilities && item.responsibilities.length > 0 && (
                      <ul className="space-y-1.5 pt-3 border-t border-[rgba(240,185,46,0.15)] text-xs text-[#f4fff8]">
                        {item.responsibilities.map((resp, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#3dff8f] shrink-0 mt-0.5" />
                            <span>{resp}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Education, Certifications & Achievements */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Education Sub-Module */}
            <div className="p-6 rounded-[22px] bg-[#02130a] card-neon-shallow shadow-xl stagger-child">
              <div className="flex items-center gap-2 text-base font-bold font-serif-heading text-[#fff1b8] mb-4 pb-3 border-b border-[rgba(240,185,46,0.15)]">
                <GraduationCap className="w-5 h-5 text-[#f0b92e]" />
                <span>Education</span>
              </div>

              <div className="space-y-4">
                {publishedEdu.map((edu) => (
                  <div key={edu.id} className="p-4 rounded-xl bg-[#010904] border border-white/5 space-y-1">
                    <div className="flex items-baseline justify-between gap-1">
                      <h5 className="font-bold text-sm text-[#fff1b8]">{edu.qualification}</h5>
                      <span className="text-[11px] font-mono text-[#f0b92e]">{edu.startDate} – {edu.endDate}</span>
                    </div>
                    <div className="text-xs text-[#3dff8f] font-mono">{edu.institution}</div>
                    {edu.field && <div className="text-xs text-[#9fbfae]">Field: {edu.field}</div>}
                    {edu.description && <p className="text-xs text-[#9fbfae]/80 mt-1 leading-relaxed">{edu.description}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Certifications Sub-Module */}
            <div className="p-6 rounded-[22px] bg-[#02130a] card-neon-shallow shadow-xl stagger-child">
              <div className="flex items-center gap-2 text-base font-bold font-serif-heading text-[#fff1b8] mb-4 pb-3 border-b border-[rgba(240,185,46,0.15)]">
                <Award className="w-5 h-5 text-[#3dff8f]" />
                <span>Certifications & Verified Courses</span>
              </div>

              {publishedCerts.length === 0 ? (
                <p className="text-xs text-[#9fbfae] italic">Certifications will appear once verified.</p>
              ) : (
                <div className="space-y-3">
                  {publishedCerts.map((cert) => (
                    <div key={cert.id} className="p-3.5 rounded-xl bg-[#010904] border border-white/5 flex items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-xs text-[#fff1b8]">{cert.title}</div>
                        <div className="text-[11px] text-[#9fbfae] mt-0.5">{cert.issuingOrg}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0a351e] text-[#3dff8f]">
                          {cert.date}
                        </span>
                        {cert.credentialUrl && (
                          <a
                            href={cert.credentialUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="block mt-1 text-[10px] text-[#f0b92e] hover:underline"
                          >
                            Verify Link ↗
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Achievements Sub-Module */}
            {publishedAch.length > 0 && (
              <div className="p-6 rounded-[22px] bg-[#02130a] card-neon-shallow shadow-xl stagger-child">
                <div className="flex items-center gap-2 text-base font-bold font-serif-heading text-[#fff1b8] mb-4 pb-3 border-b border-[rgba(240,185,46,0.15)]">
                  <Trophy className="w-5 h-5 text-[#f0b92e]" />
                  <span>Key Achievements</span>
                </div>

                <div className="space-y-3">
                  {publishedAch.map((ach) => (
                    <div key={ach.id} className="p-3.5 rounded-xl bg-[#010904] border border-white/5 space-y-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-bold text-xs text-[#fff1b8]">{ach.title}</span>
                        <span className="text-[10px] font-mono text-[#f0b92e]">{ach.date}</span>
                      </div>
                      <p className="text-xs text-[#9fbfae]">{ach.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </section>
  );
};
