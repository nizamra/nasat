import React from 'react';
import { MessageCircle, Instagram, Send, Linkedin, Twitter, Facebook, Github, Link as LinkIcon } from 'lucide-react';

// Map the backend platform choices to their respective Lucide icons
const iconMap: Record<string, React.ElementType> = {
  whatsapp: MessageCircle,
  instagram: Instagram,
  telegram: Send,
  linkedin: Linkedin,
  X: Twitter,
  facebook: Facebook,
  github: Github,
  other: LinkIcon,
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
            const IconComponent = iconMap[link.platform] || LinkIcon;
            
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
