import { useEffect, useState } from "react";
import { RELATION_TYPES, IMPLIED_SEX, type Sex } from "../constants/relations";

export type EditableRelation = {
  id: number;
  relation_type: string;
  to_user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    sex?: string;
  };
};

type Draft = {
  first_name: string;
  last_name: string;
  sex: Sex;
  relation_type: string;
};

const rowStyle = {
  padding: "12px",
  background: "var(--bg-input)",
  borderRadius: "8px",
  border: "1px solid var(--border)",
};

const dangerStyle = { color: "#ef4444", borderColor: "#ef4444" };

const fullName = (r: EditableRelation) =>
  `${r.to_user.first_name} ${r.to_user.last_name}`.trim() || r.to_user.username;

const typeLabel = (value: string) =>
  RELATION_TYPES.find(t => t.value === value)?.label || value;

// Turn a DRF error body into one readable line
const errorText = async (res: Response) => {
  try {
    const data = await res.json();
    return Object.values(data)
      .flat()
      .map(v => (typeof v === "string" ? v : JSON.stringify(v)))
      .join(" ");
  } catch {
    return "Request failed";
  }
};

export default function EditRelations({ relations }: { relations: EditableRelation[] }) {
  const [items, setItems] = useState<EditableRelation[]>(relations);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setItems(relations), [relations]);

  const original = (r: EditableRelation): Draft => ({
    first_name: r.to_user.first_name,
    last_name: r.to_user.last_name,
    sex: (r.to_user.sex || "") as Sex,
    relation_type: r.relation_type,
  });

  const startEdit = (r: EditableRelation) => {
    setEditingId(r.id);
    setConfirmId(null);
    setDraft(original(r));
    setError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
    setError("");
  };

  const changeType = (relation_type: string) =>
    setDraft(d => d && { ...d, relation_type, sex: IMPLIED_SEX[relation_type] || d.sex });

  const save = async (r: EditableRelation) => {
    if (!draft) return;
    // Send only what changed, so untouched fields are never re-validated
    const before = original(r);
    const payload = Object.fromEntries(
      Object.entries(draft).filter(([k, v]) => v !== before[k as keyof Draft])
    );
    if (Object.keys(payload).length === 0) {
      cancelEdit();
      return;
    }

    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/relations/${r.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await errorText(res));
      const updated: EditableRelation = await res.json();
      setItems(prev => prev.map(x => (x.id === r.id ? updated : x)));
      setEditingId(null);
      setDraft(null);
    } catch (err: any) {
      setError(err.message || "Failed to save relation");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (r: EditableRelation, deleteProfile: boolean) => {
    setBusy(true);
    setError("");
    try {
      const url = deleteProfile
        ? `/api/users/${r.to_user.username}/`
        : `/api/relations/${r.id}/`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok && res.status !== 404) throw new Error(await errorText(res));
      setItems(prev =>
        prev.filter(x => (deleteProfile ? x.to_user.id !== r.to_user.id : x.id !== r.id))
      );
      setConfirmId(null);
    } catch (err: any) {
      setError(err.message || "Failed to delete");
    } finally {
      setBusy(false);
    }
  };

  const implied = draft ? IMPLIED_SEX[draft.relation_type] : undefined;

  return (
    <div className="form-section" style={{ marginTop: "24px" }}>
      <h3>Relations</h3>
      <p className="text-muted" style={{ marginBottom: "12px" }}>
        Changes to relations are saved immediately.
      </p>

      {error && <div className="error-banner">✗ {error}</div>}

      {items.length === 0 ? (
        <p className="text-muted">No relations yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {items.map(r => (
            <div key={r.id} style={rowStyle}>
              {editingId === r.id && draft ? (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor={`rel-fn-${r.id}`}>First Name</label>
                      <input
                        id={`rel-fn-${r.id}`}
                        className="input-field"
                        value={draft.first_name}
                        onChange={e => setDraft({ ...draft, first_name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor={`rel-ln-${r.id}`}>Last Name</label>
                      <input
                        id={`rel-ln-${r.id}`}
                        className="input-field"
                        value={draft.last_name}
                        onChange={e => setDraft({ ...draft, last_name: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor={`rel-type-${r.id}`}>Relation</label>
                      <select
                        id={`rel-type-${r.id}`}
                        className="input-field"
                        value={draft.relation_type}
                        onChange={e => changeType(e.target.value)}
                      >
                        {RELATION_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor={`rel-sex-${r.id}`}>Sex</label>
                      <select
                        id={`rel-sex-${r.id}`}
                        className="input-field"
                        value={draft.sex}
                        disabled={!!implied}
                        onChange={e => setDraft({ ...draft, sex: e.target.value as Sex })}
                      >
                        <option value="">-- Select --</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button type="button" className="btn btn-primary" disabled={busy} onClick={() => save(r)}>
                      {busy ? "Saving..." : "Save"}
                    </button>
                    <button type="button" className="btn btn-secondary" disabled={busy} onClick={cancelEdit}>
                      Cancel
                    </button>
                  </div>
                </>
              ) : confirmId === r.id ? (
                <>
                  <p style={{ marginBottom: "8px" }}>
                    Remove <strong>{fullName(r)}</strong>?
                  </p>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => remove(r, false)}>
                      Remove relation only
                    </button>
                    <button type="button" className="btn btn-secondary" style={dangerStyle} disabled={busy} onClick={() => remove(r, true)}>
                      Also delete their profile
                    </button>
                    <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => setConfirmId(null)}>
                      Cancel
                    </button>
                  </div>
                  <p className="text-muted" style={{ marginTop: "8px", fontSize: "13px" }}>
                    Deleting a profile is permanent and removes all of its relations.
                  </p>
                </>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "14px" }}>
                    <strong>{fullName(r)}</strong> · {typeLabel(r.relation_type)}
                  </span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button type="button" className="btn btn-secondary" onClick={() => startEdit(r)}>
                      Edit
                    </button>
                    <button type="button" className="btn btn-secondary" style={dangerStyle} onClick={() => { setConfirmId(r.id); cancelEdit(); }}>
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
