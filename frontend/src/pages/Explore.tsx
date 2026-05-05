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

export default function Explore() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get current user info (optional - for checking if logged in)
    fetch("/api/users/")
      .then(res => res.json())
      .then(data => {
        console.log("API Response:", data); // Debug log
        const usersList = Array.isArray(data) ? data : data.results || [];

        if (!Array.isArray(usersList)) {
          console.error("Users is not an array:", usersList);
          return;
        }

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

  const getAvatarUrl = (avatarPath: string | null) => {
    if (!avatarPath) {
      return "https://via.placeholder.com/100?text=User";
    }
    if (avatarPath.startsWith("http")) {
      return avatarPath;
    }
    return `/media/${avatarPath}`;
  };

  const handleAddRelation = async (user: User) => {
    // Try to get current user from localStorage or API
    const storedUser = localStorage.getItem('current_user');
    let currentUserId = storedUser ? JSON.parse(storedUser).id : null;

    if (!currentUserId) {
      // Try to fetch current user from API
      try {
        const response = await fetch("/api/users/");
        const data = await response.json();
        if (data && data.length > 0) {
          currentUserId = data[0].id; // Get first user as placeholder
        }
      } catch (err) {
        console.error("Could not determine current user:", err);
      }
    }

    if (!currentUserId) {
      alert("Please login first or provide your user ID");
      return;
    }

    setCurrentUser({ id: currentUserId });
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
          fromUserId={currentUser?.id}
          toUsername={selectedUser.username}
          toUserName={getFullName(selectedUser)}
        />
      )}
    </div>
  );
}
