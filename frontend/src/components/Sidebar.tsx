import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const location = useLocation();

  const menuItems = [
    { name: "Home", icon: "🏠", path: "/" },
    { name: "Explore", icon: "🔍", path: "/explore" },
    { name: "Profile", icon: "👤", path: "/profile/me" }, 
    { name: "Notifications", icon: "🔔", badge: 3 },
    { name: "Messages", icon: "💬", badge: 2 },
    { name: "Bookmarks", icon: "🔖" },
    { name: "Groups", icon: "👥" },
    { name: "Events", icon: "📅" },
    { name: "Settings", icon: "⚙️" },
  ];

  return (
    <div className="sidebar">
      <h2><span className="sidebar-logo">🌀</span> Nexus</h2>
      
      <ul className="menu-list">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link to={item.path} key={item.name} style={{ textDecoration: 'none' }}>
              <li className={`menu-item ${isActive ? 'active' : ''}`}>
                <span className="menu-icon">{item.icon}</span>
                {item.name}
              </li>
            </Link>
          );
        })}
      </ul>
      <div className="menu-item" style={{ marginTop: 'auto' }}>
        <span className="menu-icon">🚪</span> Log out
      </div>
    </div>
  );
}
