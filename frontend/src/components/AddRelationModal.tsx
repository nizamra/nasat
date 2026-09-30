import { useState } from "react";
import { RELATION_TYPES } from "../constants/relations";

type AddRelationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (relationData: RelationData) => void;
  fromUserId: number;
  toUsername: string;
  toUserName: string;
};

export type RelationData = {
  from_user_id: number;
  to_user_username: string;
  relation_type: string;
};

export default function AddRelationModal({
  isOpen,
  onClose,
  onSubmit,
  fromUserId,
  toUsername,
  toUserName,
}: AddRelationModalProps) {
  const [selectedRelationType, setSelectedRelationType] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRelationType) return;

    setLoading(true);
    try {
      onSubmit({
        from_user_id: fromUserId,
        to_user_username: toUsername,
        relation_type: selectedRelationType,
      });
      setSelectedRelationType("");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Relation</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <p className="text-muted">
            Adding <strong>{toUserName}</strong> as a relation
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="relation-type">Select Relation Type</label>
              <select
                id="relation-type"
                className="input-field"
                value={selectedRelationType}
                onChange={(e) => setSelectedRelationType(e.target.value)}
                required
              >
                <option value="">-- Choose a relation --</option>
                {RELATION_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !selectedRelationType}
              >
                {loading ? "Adding..." : "Add Relation"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
