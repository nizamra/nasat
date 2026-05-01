export default function AboutCard() {
  return (
    <div className="card">
      <h3>About</h3>
      <div className="flex-col" style={{ marginTop: '16px', gap: '16px' }}>
        <div className="flex-row" style={{ gap: '12px' }}>
          <span className="text-muted">📍</span>
          <span className="text-muted">San Francisco, CA</span>
        </div>
        <div className="flex-row" style={{ gap: '12px' }}>
          <span className="text-muted">✉️</span>
          <a href="#" className="text-link">alex.morgan@email.com</a>
        </div>
        <div className="flex-row" style={{ gap: '12px' }}>
          <span className="text-muted">📅</span>
          <span className="text-muted">Joined March 2019</span>
        </div>
        <div className="flex-row" style={{ gap: '12px' }}>
          <span className="text-muted">🎂</span>
          <span className="text-muted">Born May 15, 1990</span>
        </div>
      </div>
    </div>
  );
}
