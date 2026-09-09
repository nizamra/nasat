import { FaPhotoVideo, FaUserTag, FaSmile } from 'react-icons/fa';
import React from 'react';

export default function CreatePost({ avatar }: { avatar?: string }) {
  // Use a data URI for default avatar to avoid network issues and infinite loops
  const defaultAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%231a2235' width='100' height='100'/%3E%3Ccircle cx='50' cy='35' r='20' fill='%2394a3b8'/%3E%3Cpath d='M30 70 Q30 55 50 55 Q70 55 70 70 L70 100 L30 100 Z' fill='%2394a3b8'/%3E%3C/svg%3E";
  const [hasError, setHasError] = React.useState(false);
  const avatarSrc = avatar || defaultAvatar;

  return (
    <div className="card">
      <div className="flex-row">
        <img
          className="avatar-md"
          src={hasError ? defaultAvatar : avatarSrc}
          alt="Profile"
          onError={() => setHasError(true)}
        />
        <input
          className="input-field"
          placeholder="What's on your mind?"
          style={{ background: 'var(--bg-dark)' }}
        />
      </div>

      <div className="flex-row space-between" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
        <div className="flex-row" style={{ gap: '24px' }}>
          <span className="text-muted" style={{ cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FaPhotoVideo size={16} /> Photo/Video
          </span>
          <span className="text-muted" style={{ cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FaUserTag size={16} /> Tag People
          </span>
          <span className="text-muted" style={{ cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FaSmile size={16} /> Feeling/Activity
          </span>
        </div>
        <button className="btn btn-primary" style={{ padding: '8px 24px' }}>Post</button>
      </div>
    </div>
  );
}
