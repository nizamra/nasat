import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type User = {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  first_name: string;
  last_name: string;
  is_verified: boolean;
};

export default function Explore() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/users/")
      .then(res => res.json())
      .then(data => {
        setUsers(Array.isArray(data) ? data : data.results || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching users:", err);
        setLoading(false);
      });
  }, []);

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFullName = (user: User) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name} ${user.last_name}`.trim();
    }
    return user.username;
  };

  const getAvatarUrl = (avatarPath: string | null) => {
    if (!avatarPath) {
      return "https://via.placeholder.com/100?text=User";
    }
    if (avatarPath.startsWith("http")) {
      return avatarPath;
    }
    return `/media/${avatarPath}`;
  };

  return (
    <div className="explore-container">
      <div className="explore-header">
        <h1>Explore Users</h1>
        <p className="text-muted">Discover and connect with members of our community</p>
      </div>

      <div className="explore-search">
        <input
          type="text"
          className="input-field"
          placeholder="Search by name, username, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="explore-loading">
          <p>Loading users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="explore-empty">
          <p>No users found</p>
        </div>
      ) : (
        <div className="users-grid">
          {filteredUsers.map(user => (
            <div
              key={user.id}
              className="user-card"
              onClick={() => navigate(`/profile/${user.username}`)}
            >
              <div className="user-card-avatar">
                <img
                  src={getAvatarUrl(user.avatar)}
                  alt={getFullName(user)}
                  className="user-avatar"
                />
                {user.is_verified && <span className="verified-badge">✓</span>}
              </div>

              <div className="user-card-content">
                <h3 className="user-fullname">
                  {getFullName(user)}
                </h3>
                <p className="user-username">@{user.username}</p>
                <p className="user-email">{user.email}</p>
              </div>

              <div className="user-card-action">
                <button className="btn btn-secondary">View Profile</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
