type Props = {
  user: string;
  handle: string;
  time: string;
  content: string;
};

export default function PostCard({ user, handle, time, content }: Props) {
  return (
    <div className="card">
      <div className="flex-row space-between">
        <div className="flex-row">
          <img className="avatar-md" src="https://i.pravatar.cc/150?u=alex" alt={user} />
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
