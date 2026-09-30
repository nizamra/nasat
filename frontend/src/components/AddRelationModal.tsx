import { useState } from "react";
import { RELATION_TYPES } from "../constants/relations";

type AddRelationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (relationData: RelationData) => void;
  people: { id: number; name: string }[];
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
  people,
  toUsername,
  toUserName,
}: AddRelationModalProps) {
  const [selectedRelationType, setSelectedRelationType] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRelationType || !selectedPersonId) return;

    setLoading(true);
    try {
      onSubmit({
        from_user_id: Number(selectedPersonId),
        to_user_username: toUsername,
        relation_type: selectedRelationType,
      });
      setSelectedRelationType("");
      setSelectedPersonId("");
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
            Connect <strong>{toUserName}</strong> to another profile
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="relation-person">Whose relation is {toUserName}?</label>
              <select
                id="relation-person"
                className="input-field"
                value={selectedPersonId}
                onChange={(e) => setSelectedPersonId(e.target.value)}
                required
              >
                <option value="">-- Choose a profile --</option>
                {people.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="relation-type">{toUserName} is their...</label>
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
                disabled={loading || !selectedRelationType || !selectedPersonId}
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
