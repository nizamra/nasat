import { Link, useLocation } from "react-router-dom";

// 1. Define exactly what a Menu Item looks like
interface MenuItem {
  name: string;
  icon: string;
  path: string;   // This must be a string, not undefined
  badge?: number; // Optional
  active?: boolean; // Optional
}

export default function Sidebar() {
  const location = useLocation();

  // 2. Explicitly type the array as MenuItem[]
  const menuItems: MenuItem[] = [
    { name: "Home", icon: "🏠", path: "/" },
    { name: "Explore", icon: "🔍", path: "/explore" },
    { name: "Notifications", icon: "🔔", path: "/notifications", badge: 3 },
    { name: "Messages", icon: "💬", path: "/messages", badge: 2 },
    { name: "Bookmarks", icon: "🔖", path: "/bookmarks" },
    { name: "Groups", icon: "👥", path: "/groups" },
    { name: "Events", icon: "📅", path: "/events" },
    { name: "Profile", icon: "👤", path: "/profile/me" }, 
    { name: "Settings", icon: "⚙️", path: "/settings" },
  ];

  return (
    <div className="sidebar">
      <h2><span className="sidebar-logo">🌀</span> Nexus</h2>
      
      <ul className="menu-list">
        {menuItems.map((item) => {
          // Check if current URL matches the item path
          const isActive = location.pathname === item.path;
          
          return (
            <Link 
              to={item.path} 
              key={item.name} 
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <li className={`menu-item ${isActive ? 'active' : ''}`}>
                <span className="menu-icon">{item.icon}</span>
                {item.name}
                {item.badge && <span className="badge">{item.badge}</span>}
              </li>
            </Link>
          );
        })}
      </ul>

      {/* Logout is usually a button/action, not a Link */}
      <div className="menu-item" style={{ marginTop: 'auto' }} onClick={() => console.log("Logout")}>
        <span className="menu-icon">🚪</span> Log out
      </div>
    </div>
  );
}
