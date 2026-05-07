import { useNavigate } from "react-router-dom";
import React from "react";

type ProfileProps = {
  username: string;
  title: string;
  bio: string;
  avatar: string | null;
  is_verified: boolean;
};

export default function ProfileCard({ username, title, bio, avatar, is_verified }: ProfileProps) {
  const navigate = useNavigate();
  // Use a data URI for default avatar to avoid network issues and infinite loops
  const defaultAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%231a2235' width='100' height='100'/%3E%3Ccircle cx='50' cy='35' r='20' fill='%2394a3b8'/%3E%3Cpath d='M30 70 Q30 55 50 55 Q70 55 70 70 L70 100 L30 100 Z' fill='%2394a3b8'/%3E%3C/svg%3E";
  const [hasError, setHasError] = React.useState(false);

  const avatarSrc = avatar && avatar.startsWith('http')
    ? avatar
    : defaultAvatar;

  return (
    <div className="card flex-row" style={{ gap: '32px', alignItems: 'flex-start' }}>
      <img
        className="avatar-lg"
        src={hasError ? defaultAvatar : avatarSrc}
        alt={username}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onError={() => setHasError(true)}
      />

      <div className="flex-col" style={{ flex: 1 }}>
        <div className="flex-row space-between" style={{ width: '100%' }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {username} {is_verified && <span style={{ color: 'var(--accent-blue)', fontSize: '18px' }}>✔️</span>}
            </h2>
            <p className="text-muted" style={{ marginTop: '4px' }}>@{username}</p>
          </div>
          <div className="flex-row">
            <button
              className="btn btn-secondary"
              onClick={() => navigate(`/edit-user/${username}`)}
            >
              Edit Profile
            </button>
            <button className="btn btn-primary">Add Story</button>
          </div>
        </div>
        {/* 
        <div style={{ marginTop: '16px', lineHeight: '1.6' }}>
          <p>Entrepreneur · Investor · Travel Enthusiast</p>
          <p className="text-muted">Building things, investing in people, and exploring the world.</p>
        </div> */}

        <div style={{ marginTop: '16px', lineHeight: '1.6' }}>
          <p>{title}</p>
          <p className="text-muted">{bio}</p>
        </div>
        <div className="flex-row" style={{ marginTop: '24px', gap: '32px' }}>
          <div><h3 style={{ margin: 0 }}>156</h3><span className="text-muted">Posts</span></div>
          <div><h3 style={{ margin: 0 }}>8.2K</h3><span className="text-muted">Followers</span></div>
          <div><h3 style={{ margin: 0 }}>512</h3><span className="text-muted">Following</span></div>
        </div>
      </div>
    </div>
  );
}
