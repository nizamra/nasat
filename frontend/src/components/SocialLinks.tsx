export default function SocialLinks() {
  const links = [
    { name: "WhatsApp", icon: "🟢" },
    { name: "Instagram", icon: "🟣" },
    { name: "Telegram", icon: "🔵" },
    { name: "LinkedIn", icon: "💼" },
    { name: "Twitter", icon: "🐦" },
  ];

  return (
    <div className="card">
      <h3>Social Links</h3>
      <div className="flex-col" style={{ marginTop: '16px', gap: '16px' }}>
        <div className="grid-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {links.map((link) => (
            <div key={link.name} className="flex-row" style={{ gap: '12px' }}>
              <span>{link.icon}</span>
              <span style={{ fontSize: '14px' }}>{link.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
