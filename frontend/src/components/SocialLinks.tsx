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
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {links.map((link, index) => {
            const IconComponent = iconMap[link.platform] || FaLink;

            return (
              <a
                key={index}
                href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-main)',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-blue)';
                  e.currentTarget.style.color = 'var(--accent-blue)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.color = 'var(--text-main)';
                }}
                title={link.url}
              >
                <IconComponent size={20} />
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
