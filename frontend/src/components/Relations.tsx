import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type Relation = {
  id: number;
  to_user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    avatar: string | null;
  };
  relation_type: string;
};

interface RelationsProps {
  username?: string;
}

export default function Relations({ username }: RelationsProps) {
  const [relations, setRelations] = useState<Relation[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!username) return;

    setLoading(true);
    fetch(`/api/users/${username}/`)
      .then(res => res.json())
      .then(data => {
        setRelations(data.relations_from || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching relations:", err);
        setLoading(false);
      });
  }, [username]);

  const displayedRelations = relations.slice(0, 4);
  const hiddenCount = relations.length - displayedRelations.length;

  const getFullName = (relation: Relation) => {
    if (relation.to_user.first_name || relation.to_user.last_name) {
      return `${relation.to_user.first_name} ${relation.to_user.last_name}`.trim();
    }
    return relation.to_user.username;
  };

  const getAvatarUrl = (avatarPath: string | null) => {
    if (!avatarPath) {
      return "https://via.placeholder.com/56?text=U";
    }
    if (avatarPath.startsWith("http")) {
      return avatarPath;
    }
    return `/media/${avatarPath}`;
  };

  return (
    <div className="card">
      <h3>Relations ({relations.length})</h3>
      {loading ? (
        <p className="text-muted" style={{ marginTop: '16px', textAlign: 'center' }}>
          Loading...
        </p>
      ) : relations.length === 0 ? (
        <p className="text-muted" style={{ marginTop: '16px', textAlign: 'center' }}>
          No relations yet
        </p>
      ) : (
        <div className="relations-scroll-container">
          <div className="relations-scroll">
            {displayedRelations.map(r => (
              <div
                key={r.id}
                className="relation-item"
                onClick={() => navigate(`/profile/${r.to_user.username}`)}
              >
                <img
                  className="avatar-sm"
                  src={getAvatarUrl(r.to_user.avatar)}
                  alt={getFullName(r)}
                  title={getFullName(r)}
                />
                <div className="relation-info">
                  <p className="relation-name">{getFullName(r)}</p>
                  <span className="relation-type">{r.relation_type}</span>
                </div>
              </div>
            ))}
            {hiddenCount > 0 && (
              <div className="relation-more">
                <span>+{hiddenCount}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
