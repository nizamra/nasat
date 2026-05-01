export default function Sidebar() {
  const menuItems = [
    { name: "Home", icon: "🏠" },
    { name: "Explore", icon: "🔍" },
    { name: "Notifications", icon: "🔔", badge: 3 },
    { name: "Messages", icon: "💬", badge: 2 },
    { name: "Bookmarks", icon: "🔖" },
    { name: "Groups", icon: "👥" },
    { name: "Events", icon: "📅" },
    { name: "Profile", icon: "👤", active: true },
    { name: "Settings", icon: "⚙️" },
  ];

  return (
    <div className="sidebar">
      <h2><span className="sidebar-logo">🌀</span> Nexus</h2>
      
      <ul className="menu-list">
        {menuItems.map((item) => (
          <li key={item.name} className={`menu-item ${item.active ? 'active' : ''}`}>
            <span className="menu-icon">{item.icon}</span>
            {item.name}
            {item.badge && <span className="badge">{item.badge}</span>}
          </li>
        ))}
      </ul>

      <div className="menu-item" style={{ marginTop: 'auto' }}>
        <span className="menu-icon">🚪</span> Log out
      </div>
    </div>
  );
}