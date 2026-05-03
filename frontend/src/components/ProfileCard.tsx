type ProfileProps = {
  username: string;
  title: string;
  bio: string;
  avatar: string | null;
  is_verified: boolean;
};

export default function ProfileCard({ username, title, bio, avatar, is_verified }: ProfileProps) {
  return (
    <div className="card flex-row" style={{ gap: '32px', alignItems: 'flex-start' }}>
      <img
        className="avatar-lg"
        src={avatar || "https://i.pravatar.cc/300"}
        alt={username}
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
            <button className="btn btn-secondary">Edit Profile</button>
            <button className="btn btn-primary">Add Story</button>
          </div>
        </div>

        <div style={{ marginTop: '16px', lineHeight: '1.6' }}>
          <p>Entrepreneur · Investor · Travel Enthusiast</p>
          <p className="text-muted">Building things, investing in people, and exploring the world.</p>
        </div>

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
