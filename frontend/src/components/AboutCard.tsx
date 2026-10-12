import React from 'react';
import { FaMapMarkerAlt, FaEnvelope, FaBirthdayCake, FaVenusMars } from 'react-icons/fa';
// # TODO: test LocateFixed instead of MapPin

interface UserData {
  location?: string;
  current_city?: string;
  place_of_birth?: string;
  email?: string;
  birth_date?: string;
  birth_date_precision?: string;
  death_date?: string;
  death_date_precision?: string;
  age?: number | null;
  sex?: string;
  height_cm?: number | null;
  weight_kg?: number | string | null;
}

export default function AboutCard({ user }: { user?: UserData }) {
  if (!user) return null;

  const birthDate = user.birth_date
    ? new Date(user.birth_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  const hasAge = typeof user.age === 'number';
  const sexLabel = user.sex ? user.sex.charAt(0).toUpperCase() + user.sex.slice(1) : null;
  const datePrecision = (precision?: string) => precision && precision !== "exact"
    ? ` (${precision === "day_approximate" ? "approximate" : precision})` : "";

  return (
    <div className="card">
      <h3>About</h3>
      <div className="flex-col" style={{ marginTop: '16px', gap: '16px' }}>
        
        {(user.current_city || user.location) && (
          <div className="flex-row" style={{ gap: '12px' }}>
            <FaMapMarkerAlt size={20} className="text-muted" />
            <span className="text-muted">{user.current_city || user.location}</span>
          </div>
        )}

        {user.place_of_birth && <div className="text-muted">Born in {user.place_of_birth}</div>}

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
            <span className="text-muted" title={birthDate ? `Born ${birthDate}${datePrecision(user.birth_date_precision)}` : undefined}>
              {user.age} years old{user.death_date ? " at death" : ""}
            </span>
          </div>
        )}

        {user.death_date && <div className="text-muted">Died {new Date(user.death_date).toLocaleDateString()}{datePrecision(user.death_date_precision)}</div>}

        {user.height_cm != null && (
          <div className="flex-row" style={{ gap: '12px' }}>
            <span className="text-muted">Height</span>
            <span className="text-muted">{user.height_cm} cm</span>
          </div>
        )}

        {user.weight_kg != null && (
          <div className="flex-row" style={{ gap: '12px' }}>
            <span className="text-muted">Weight</span>
            <span className="text-muted">{user.weight_kg} kg</span>
          </div>
        )}

      </div>
    </div>
  );
}
