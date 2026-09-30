import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AddRelationModal, { RelationData } from "../components/AddRelationModal";

type User = {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  first_name: string;
  last_name: string;
  is_verified: boolean;
};

// /api/users/ is paginated; follow `next` so every profile is loaded
const fetchAllUsers = async (): Promise<User[]> => {
  const all: User[] = [];
  let url: string | null = "/api/users/";
  while (url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to load users");
    const data = await res.json();
    if (Array.isArray(data)) return data;
    all.push(...(data.results || []));
    // `next` is absolute; keep path + query so the request stays same-origin
    url = data.next ? new URL(data.next).pathname + new URL(data.next).search : null;
  }
  return all;
};

export default function Explore() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllUsers()
      .then(usersList => {
        // Sort by verified status (verified first) and date_joined
        const sorted = usersList.sort((a: User, b: User) => {
          if (b.is_verified !== a.is_verified) {
            return b.is_verified ? 1 : -1;
          }
          return 0;
        });

        console.log("Loaded users:", sorted.length);
        setUsers(sorted);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching users:", err);
        setLoading(false);
      });
  }, []);

  const filteredUsers = users
    .filter(user => {
      const matchesSearch =
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesVerified = verifiedOnly ? user.is_verified : true;

      return matchesSearch && matchesVerified;
    })
    .sort((a, b) => {
      // Keep verified users first
      if (b.is_verified !== a.is_verified) {
        return b.is_verified ? 1 : -1;
      }
      return 0;
    });

  const getFullName = (user: User) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name} ${user.last_name}`.trim();
    }
    return user.username;
  };

  const defaultAvatarDataUri = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%231a2235' width='100' height='100'/%3E%3Ccircle cx='50' cy='35' r='20' fill='%2394a3b8'/%3E%3Cpath d='M30 70 Q30 55 50 55 Q70 55 70 70 L70 100 L30 100 Z' fill='%2394a3b8'/%3E%3C/svg%3E";

  const getAvatarUrl = (avatarPath: string | null) => {
    if (!avatarPath) {
      return defaultAvatarDataUri;
    }
    if (avatarPath.startsWith("http")) {
      return avatarPath;
    }
    return `/media/${avatarPath}`;
  };

  const handleAddRelation = (user: User) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleSubmitRelation = async (relationData: RelationData) => {
    try {
      const response = await fetch("/api/relations/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(relationData),
      });

      if (!response.ok) {
        throw new Error("Failed to create relation");
      }

      alert("Relation added successfully! The reverse relation has been created automatically.");
      setShowModal(false);
      setSelectedUser(null);
    } catch (err: any) {
      alert("Error: " + (err.message || "Failed to add relation"));
    }
  };

  return (
    <div className="explore-container">
      <div className="explore-header">
        <h1>Explore Users</h1>
        <p className="text-muted">
          Discover and connect with members of our community
        </p>
      </div>

      <div className="explore-controls">
        <div className="explore-search">
          <input
            type="text"
            className="input-field"
            placeholder="Search by name, username, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="explore-filters">
          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
            />
            <span>Verified Users Only</span>
          </label>
        </div>
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
        <>
          <div className="explore-count">
            Showing {filteredUsers.length} of {users.length} users
          </div>
          <div className="users-grid">
            {filteredUsers.map(user => (
              <div key={user.id} className="user-card">
                <div
                  className="user-card-avatar"
                  onClick={() => navigate(`/profile/${user.username}`)}
                  style={{ cursor: "pointer" }}
                >
                  <img
                    src={getAvatarUrl(user.avatar)}
                    alt={getFullName(user)}
                    className="user-avatar"
                  />
                  {user.is_verified && (
                    <span className="verified-badge" title="Verified">
                      ✓
                    </span>
                  )}
                </div>

                <div className="user-card-content">
                  <h3
                    className="user-fullname"
                    onClick={() => navigate(`/profile/${user.username}`)}
                    style={{ cursor: "pointer" }}
                  >
                    {getFullName(user)}
                  </h3>
                  <p className="user-username">@{user.username}</p>
                  <p className="user-email">{user.email}</p>
                </div>

                <div className="user-card-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => navigate(`/profile/${user.username}`)}
                  >
                    View Profile
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleAddRelation(user)}
                  >
                    Add Relation
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {selectedUser && (
        <AddRelationModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedUser(null);
          }}
          onSubmit={handleSubmitRelation}
          people={users
            .filter(u => u.id !== selectedUser.id)
            .map(u => ({ id: u.id, name: `${getFullName(u)} (@${u.username})` }))}
          toUsername={selectedUser.username}
          toUserName={getFullName(selectedUser)}
        />
      )}
    </div>
  );
}
