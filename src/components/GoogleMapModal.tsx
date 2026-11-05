import React, { useState } from 'react';
import { GoogleLocationIcon } from './GoogleLocationIcon';
import {
  X,
  ExternalLink,
  Navigation,
  Compass,
  Copy,
  Check,
  MapPin,
  Clock,
  Shield,
  Layers
} from 'lucide-react';

interface GoogleMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationTitle?: string;
}

export const GoogleMapModal: React.FC<GoogleMapModalProps> = ({
  isOpen,
  onClose,
  locationTitle = 'Dodoma CBD, Tanzania',
}) => {
  const [copied, setCopied] = useState(false);
  const [mapType, setMapType] = useState<'m' | 'k'>('m'); // 'm' = Roadmap, 'k' = Satellite

  if (!isOpen) return null;

  // Dodoma CBD precise coordinates
  const lat = -6.173056;
  const lng = 35.741944;
  const coordinatesString = `${lat}, ${lng}`;

  // Direct Google Maps web & app links
  const googleMapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=Dodoma+CBD+Tanzania`;
  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const embedUrl = `https://maps.google.com/maps?q=${lat},${lng}&t=${mapType}&z=15&ie=UTF8&iwloc=&output=embed`;

  const handleCopyCoordinates = () => {
    navigator.clipboard.writeText(coordinatesString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="google-map-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-[#011409] card-neon-shallow rounded-2xl overflow-hidden"
      >
        {/* Neon accent top border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#3dff8f] via-[#f0b92e] to-[#3dff8f] shadow-[0_0_12px_#3dff8f]" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(240,185,46,0.25)] bg-[#021d0e]">
          <div className="flex items-center gap-3">
            {/* Blinking small neon Google Location pin */}
            <div className="w-9 h-9 rounded-xl bg-[#032a14] border border-[#3dff8f]/40 flex items-center justify-center shadow-[0_0_6px_rgba(61,255,143,0.2)]">
              <GoogleLocationIcon className="w-5 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  id="google-map-title"
                  className="font-serif-heading font-extrabold text-base sm:text-lg text-[#f4fff8]"
                >
                  Dodoma CBD · Google GPS Map
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#0a351e] text-[#3dff8f] border border-[#3dff8f]/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3dff8f] animate-ping" />
                  <span>GPS ACTIVE</span>
                </span>
              </div>
              <p className="text-xs text-[#9fbfae] font-mono flex items-center gap-2">
                <span>{locationTitle}</span>
                <span className="text-[#f0b92e]">•</span>
                <span>East Africa Time (EAT, UTC+3)</span>
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-black/40 hover:bg-black/80 border border-white/20 hover:border-[#3dff8f] flex items-center justify-center text-[#9fbfae] hover:text-[#3dff8f] transition-all cursor-pointer"
            aria-label="Close Google GPS Map dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Map Control Bar */}
        <div className="px-5 py-2.5 bg-[#011a0c] border-b border-[rgba(240,185,46,0.15)] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          {/* Coordinates indicator */}
          <div className="flex items-center gap-2 text-[#c8e2d4]">
            <Compass className="w-3.5 h-3.5 text-[#3dff8f]" />
            <span>GPS:</span>
            <span className="text-[#fff1b8] font-bold tracking-wider">{coordinatesString}</span>
            <button
              onClick={handleCopyCoordinates}
              className="inline-flex items-center gap-1 ml-1 px-2 py-0.5 rounded bg-[#032a14] hover:bg-[#064220] border border-[#3dff8f]/30 text-[11px] text-[#3dff8f] transition-colors cursor-pointer"
              title="Copy GPS coordinates"
            >
              {copied ? <Check className="w-3 h-3 text-[#3dff8f]" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied!' : 'Copy GPS'}</span>
            </button>
          </div>

          {/* Map view switcher (Roadmap vs Satellite) */}
          <div className="flex items-center gap-1 bg-[#011208] p-0.5 rounded-lg border border-[rgba(240,185,46,0.2)]">
            <button
              onClick={() => setMapType('m')}
              className={`px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                mapType === 'm'
                  ? 'bg-[#0a351e] text-[#3dff8f] font-bold border border-[#3dff8f]/40'
                  : 'text-[#9fbfae] hover:text-[#f4fff8]'
              }`}
            >
              Roadmap
            </button>
            <button
              onClick={() => setMapType('k')}
              className={`px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                mapType === 'k'
                  ? 'bg-[#0a351e] text-[#3dff8f] font-bold border border-[#3dff8f]/40'
                  : 'text-[#9fbfae] hover:text-[#f4fff8]'
              }`}
            >
              Satellite
            </button>
          </div>
        </div>

        {/* Embedded Interactive Google Map */}
        <div className="relative flex-1 min-h-[340px] sm:min-h-[420px] bg-[#021008] overflow-hidden">
          <iframe
            title="Google GPS Map - Dodoma CBD, Tanzania"
            src={embedUrl}
            className="w-full h-full min-h-[340px] sm:min-h-[420px] border-0"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />

          {/* Floating GPS Target Overlay indicator in bottom-left corner */}
          <div className="absolute bottom-3 left-3 bg-[#011409]/95 backdrop-blur-md px-3 py-2 rounded-xl border border-[rgba(240,185,46,0.3)] shadow-lg text-[11px] font-mono pointer-events-none">
            <div className="flex items-center gap-1.5 text-[#3dff8f] font-bold">
              <span className="w-2 h-2 rounded-full bg-[#3dff8f] animate-ping" />
              <span>Dodoma CBD GPS Lock</span>
            </div>
            <div className="text-[#c8e2d4]">Tanzania National Capital</div>
          </div>
        </div>

        {/* Modal Footer with Primary Action Buttons */}
        <div className="px-5 py-4 bg-[#021a0d] border-t border-[rgba(240,185,46,0.25)] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[#9fbfae] font-mono flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-[#f0b92e]" />
            <span>Dodoma CBD · Tanzania</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Open Google Maps Directions in new tab */}
            <a
              href={googleMapsDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#032a14] hover:bg-[#074723] border border-[#3dff8f]/40 hover:border-[#3dff8f] text-xs font-semibold text-[#3dff8f] transition-all cursor-pointer shadow-md"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>GPS Directions</span>
            </a>

            {/* Open directly in Google Maps Web/App */}
            <a
              href={googleMapsSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs text-[#052e1b] bg-gradient-to-r from-[#3dff8f] to-[#f0b92e] hover:from-white hover:to-[#3dff8f] shadow-[0_0_15px_rgba(61,255,143,0.4)] transition-all cursor-pointer"
            >
              <GoogleLocationIcon className="w-3.5 h-4" shine={false} />
              <span>Open in Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
