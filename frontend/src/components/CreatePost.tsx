export default function CreatePost() {
  return (
    <div className="card">
      <div className="flex-row">
        <img className="avatar-md" src="https://i.pravatar.cc/150?u=alex" alt="Profile" />
        <input 
          className="input-field" 
          placeholder="What's on your mind?" 
          style={{ background: 'var(--bg-dark)' }}
        />
      </div>
      
      <div className="flex-row space-between" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
        <div className="flex-row" style={{ gap: '24px' }}>
          <span className="text-muted" style={{ cursor: 'pointer', fontSize: '14px' }}>🖼️ Photo/Video</span>
          <span className="text-muted" style={{ cursor: 'pointer', fontSize: '14px' }}>👤 Tag People</span>
          <span className="text-muted" style={{ cursor: 'pointer', fontSize: '14px' }}>😊 Feeling/Activity</span>
        </div>
        <button className="btn btn-primary" style={{ padding: '8px 24px' }}>Post</button>
      </div>
    </div>
  );
}
