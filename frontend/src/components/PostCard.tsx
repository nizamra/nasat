import React from 'react';

type Props = {
  user: string;
  handle: string;
  time: string;
  content: string;
  avatar?: string;
};

export default function PostCard({ user, handle, time, content, avatar }: Props) {
  // Use a data URI for default avatar to avoid network issues and infinite loops
  const defaultAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%231a2235' width='100' height='100'/%3E%3Ccircle cx='50' cy='35' r='20' fill='%2394a3b8'/%3E%3Cpath d='M30 70 Q30 55 50 55 Q70 55 70 70 L70 100 L30 100 Z' fill='%2394a3b8'/%3E%3C/svg%3E";
  const [hasError, setHasError] = React.useState(false);
  const avatarSrc = avatar || defaultAvatar;

  return (
    <div className="card">
      <div className="flex-row space-between">
        <div className="flex-row">
          <img
            className="avatar-md"
            src={hasError ? defaultAvatar : avatarSrc}
            alt={user}
            onError={() => setHasError(true)}
          />
          <div>
            <h4 style={{ fontSize: '15px' }}>{user}</h4>
            <span className="text-muted" style={{ fontSize: '13px' }}>{handle} · {time}</span>
          </div>
        </div>
        <button className="btn-secondary" style={{ background: 'transparent', border: 'none', color: '#94a3b8' }}>•••</button>
      </div>

      <div style={{ marginTop: '16px' }}>
        <p style={{ fontSize: '15px', lineHeight: '1.5' }}>{content}</p>
      </div>
    </div>
  );
}
