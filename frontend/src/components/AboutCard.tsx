import React from 'react';
import { FaMapMarkerAlt, FaEnvelope, FaBirthdayCake, FaVenusMars } from 'react-icons/fa';
// # TODO: test LocateFixed instead of MapPin

interface UserData {
  location?: string;
  email?: string;
  birth_date?: string;
  age?: number | null;
  sex?: string;
}

export default function AboutCard({ user }: { user?: UserData }) {
  if (!user) return null;

  const birthDate = user.birth_date
    ? new Date(user.birth_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  const hasAge = typeof user.age === 'number';
  const sexLabel = user.sex ? user.sex.charAt(0).toUpperCase() + user.sex.slice(1) : null;

  return (
    <div className="card">
      <h3>About</h3>
      <div className="flex-col" style={{ marginTop: '16px', gap: '16px' }}>
        
        {user.location && (
          <div className="flex-row" style={{ gap: '12px' }}>
            <FaMapMarkerAlt size={20} className="text-muted" />
            <span className="text-muted">{user.location}</span>
          </div>
        )}

        {user.email && (
          <div className="flex-row" style={{ gap: '12px' }}>
            <FaEnvelope size={20} className="text-muted" />
            <a href={`mailto:${user.email}`} className="text-link">{user.email}</a>
          </div>
        )}

        {sexLabel && (
          <div className="flex-row" style={{ gap: '12px' }}>
            <FaVenusMars size={20} className="text-muted" />
            <span className="text-muted">{sexLabel}</span>
          </div>
        )}

        {hasAge && (
          <div className="flex-row" style={{ gap: '12px' }}>
            <FaBirthdayCake size={20} className="text-muted" />
            <span className="text-muted" title={birthDate ? `Born ${birthDate}` : undefined}>
              {user.age} years old
            </span>
          </div>
        )}

      </div>
    </div>
  );
}
