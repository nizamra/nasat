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
  start_date?: string | null;
  end_date?: string | null;
  date_precision?: string;
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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [datePrecision, setDatePrecision] = useState("exact");
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
        start_date: startDate || null,
        end_date: endDate || null,
        date_precision: datePrecision,
      });
      setSelectedRelationType("");
      setSelectedPersonId("");
      setStartDate("");
      setEndDate("");
      setDatePrecision("exact");
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
            Record a relationship for <strong>{toUserName}</strong>
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="relation-person">Which person is related to {toUserName}?</label>
              <select
                id="relation-person"
                className="input-field"
                value={selectedPersonId}
                onChange={(e) => setSelectedPersonId(e.target.value)}
                required
              >
                <option value="">-- Choose a person --</option>
                {people.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="relation-start">Relationship start</label>
                <input id="relation-start" type="date" className="input-field" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="relation-end">Relationship end</label>
                <input id="relation-end" type="date" className="input-field" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="relation-date-precision">Date precision</label>
              <select id="relation-date-precision" className="input-field" value={datePrecision} onChange={e => setDatePrecision(e.target.value)}>
                <option value="exact">Exact</option><option value="day_approximate">Approximate day</option>
                <option value="month">Month only</option><option value="year">Year only</option>
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
