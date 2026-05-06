type Props = {
  user: string;
  handle: string;
  time: string;
  content: string;
  avatar?: string;
};

export default function PostCard({ user, handle, time, content, avatar }: Props) {
  const defaultAvatar = "/default.jpg";
  const avatarSrc = avatar || defaultAvatar;

  return (
    <div className="card">
      <div className="flex-row space-between">
        <div className="flex-row">
          <img
            className="avatar-md"
            src={avatarSrc}
            alt={user}
            onError={(e) => {
              (e.target as HTMLImageElement).src = defaultAvatar;
            }}
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
