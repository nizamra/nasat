import React from 'react';

export default function Header({ avatar }: { avatar?: string }) {
  // Use a data URI for default avatar to avoid network issues and infinite loops
  const defaultAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%231a2235' width='100' height='100'/%3E%3Ccircle cx='50' cy='35' r='20' fill='%2394a3b8'/%3E%3Cpath d='M30 70 Q30 55 50 55 Q70 55 70 70 L70 100 L30 100 Z' fill='%2394a3b8'/%3E%3C/svg%3E";
  const avatarSrc = avatar || defaultAvatar;
  const [hasError, setHasError] = React.useState(false);

  return (
    <div className="flex-row space-between">
      <div style={{ width: '400px', position: 'relative' }}>
        <span style={{ position: 'absolute', left: '16px', top: '12px', color: '#94a3b8' }}>🔍</span>
        <input
          className="input-field"
          placeholder="Search for people, posts, groups..."
          style={{ paddingLeft: '44px' }}
        />
      </div>

      <div className="flex-row">
        <button className="btn btn-secondary" style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0 }}>+</button>
        <button className="btn btn-secondary" style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0 }}>💬</button>
        <button className="btn btn-secondary" style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0 }}>🔔</button>
        <img
          className="avatar-md"
          src={hasError ? defaultAvatar : avatarSrc}
          alt="Profile"
          onError={() => setHasError(true)}
        />
      </div>
    </div>
  );
}
