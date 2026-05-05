import { Link, useLocation } from "react-router-dom";
import { 
  FaHome, 
  FaCompass, 
  FaBell, 
  FaWhatsapp, 
  FaBookmark, 
  FaUsers, 
  FaCalendar, 
  FaUser, 
  FaCog 
} from 'react-icons/fa';

// 1. Define exactly what a Menu Item looks like
interface MenuItem {
  name: string;
  icon: React.ElementType;
  path: string;   // This must be a string, not undefined
  badge?: number; // Optional
  active?: boolean; // Optional
}

export default function Sidebar() {
  const location = useLocation();

  // 2. Explicitly type the array as MenuItem[]
  const menuItems: MenuItem[] = [
    { name: "Home", icon: FaHome, path: "/" },
    { name: "Explore", icon: FaCompass, path: "/explore" },
    { name: "Notifications", icon: FaBell, path: "/notifications", badge: 3 },
    { name: "Messages", icon: FaWhatsapp, path: "/messages", badge: 2 },
    { name: "Bookmarks", icon: FaBookmark, path: "/bookmarks" },
    { name: "Groups", icon: FaUsers, path: "/groups" },
    { name: "Events", icon: FaCalendar, path: "/events" },
    { name: "Profile", icon: FaUser, path: "/profile/me" },
    { name: "Settings", icon: FaCog, path: "/settings" },
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
                <span className="menu-icon"><item.icon size={20} /></span>
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
