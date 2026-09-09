import React from 'react';
import { FaMapMarkerAlt, FaEnvelope, FaCalendarAlt, FaBirthdayCake } from 'react-icons/fa';
// # TODO: test LocateFixed instead of MapPin

interface UserData {
  location?: string;
  email?: string;
  date_joined?: string;
  birth_date?: string;
}

export default function AboutCard({ user }: { user?: UserData }) {
  if (!user) return null;

  // Safely format dates if they exist
  const joinedDate = user.date_joined 
    ? new Date(user.date_joined).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : null;
    
  const birthDate = user.birth_date 
    ? new Date(user.birth_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

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

        {joinedDate && (
          <div className="flex-row" style={{ gap: '12px' }}>
            <FaCalendarAlt size={20} className="text-muted" />
            <span className="text-muted">Joined {joinedDate}</span>
          </div>
        )}

        {birthDate && (
          <div className="flex-row" style={{ gap: '12px' }}>
            <FaBirthdayCake size={20} className="text-muted" />
            <span className="text-muted">Born {birthDate}</span>
          </div>
        )}

      </div>
    </div>
  );
}
