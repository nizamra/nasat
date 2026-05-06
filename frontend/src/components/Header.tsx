export default function Header({ avatar }: { avatar?: string }) {
  const defaultAvatar = "/default.jpg";
  const avatarSrc = avatar || defaultAvatar;

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
          src={avatarSrc}
          alt="Profile"
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultAvatar;
          }}
        />
      </div>
    </div>
  );
}
