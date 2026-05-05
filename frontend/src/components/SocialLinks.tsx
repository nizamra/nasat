import React from 'react';
import { 
  FaWhatsapp, 
  FaInstagram, 
  FaTelegram, 
  FaLinkedin, 
  FaTwitter, 
  FaFacebook, 
  FaGithub,
  FaLink 
} from 'react-icons/fa';

// Map the backend platform choices to their respective react-icons
const iconMap: Record<string, React.ElementType> = {
  whatsapp: FaWhatsapp,
  instagram: FaInstagram,
  telegram: FaTelegram,
  linkedin: FaLinkedin,
  X: FaTwitter,
  facebook: FaFacebook,
  github: FaGithub,
  other: FaLink,
};

interface SocialLinkData {
  platform: string;
  url: string;
}

export default function SocialLinks({ links = [] }: { links?: SocialLinkData[] }) {
  // If the user has no links, hide the component entirely
  if (!links || links.length === 0) return null;

  return (
    <div className="card">
      <h3>Social Links</h3>
      <div className="flex-col" style={{ marginTop: '16px', gap: '16px' }}>
        <div className="grid-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {links.map((link, index) => {
            const IconComponent = iconMap[link.platform] || FaLink;
            
            return (
              <div key={index} className="flex-row" style={{ gap: '12px' }}>
                <span><IconComponent size={20} /></span>
                {/* Breaks long URLs or text so it doesn't overflow the container */}
                <span style={{ fontSize: '14px', wordBreak: 'break-word' }}>
                  {link.url}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
