import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import React from "react";

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
