import { useState } from "react";

type Field = {
  name: string;
  label: string;
  type?: "text" | "date" | "textarea" | "select";
  options?: { value: string; label: string }[];
};

type RecordItem = Record<string, any> & { id: number };
type Section = { title: string; endpoint: string; key: string; fields: Field[] };

const options = (values: [string, string][]) =>
  values.map(([value, label]) => ({ value, label }));
const dates = options([
  ["exact", "Exact"], ["day_approximate", "Approximate day"],
  ["month", "Month only"], ["year", "Year only"],
]);

const sections: Section[] = [
  { title: "Notes", endpoint: "notes", key: "notes", fields: [
    { name: "title", label: "Title" }, { name: "content", label: "Note", type: "textarea" },
  ] },
  { title: "Aliases and former names", endpoint: "person-aliases", key: "aliases", fields: [
    { name: "name", label: "Name" },
    { name: "alias_type", label: "Type", type: "select", options: options([
      ["former_name", "Former name"], ["alias", "Alias"], ["preferred_name", "Preferred name"],
    ]) },
    { name: "notes", label: "Notes", type: "textarea" },
  ] },
  { title: "Life timeline", endpoint: "life-events", key: "life_events", fields: [
    { name: "title", label: "Event" }, { name: "event_date", label: "Date", type: "date" },
    { name: "date_precision", label: "Date precision", type: "select", options: dates },
    { name: "place", label: "Place" }, { name: "description", label: "Description", type: "textarea" },
    { name: "source_notes", label: "Source notes", type: "textarea" },
  ] },
  { title: "Devices", endpoint: "devices", key: "devices", fields: [
    { name: "device_type", label: "Type", type: "select", options: options([
      ["mobile", "Mobile phone"], ["tablet", "Tablet"], ["laptop", "Laptop"],
      ["desktop", "Desktop PC"], ["other", "Other"],
    ]) },
    { name: "manufacturer", label: "Manufacturer" }, { name: "model", label: "Model" },
    { name: "notes", label: "Notes", type: "textarea" },
  ] },
  { title: "Languages", endpoint: "languages", key: "languages", fields: [
    { name: "language", label: "Language" },
    { name: "proficiency", label: "Proficiency", type: "select", options: options([
      ["native", "Native"], ["fluent", "Fluent"], ["learning", "Learning"],
    ]) },
    { name: "notes", label: "Notes" },
  ] },
  { title: "Emergency contacts", endpoint: "emergency-contacts", key: "emergency_contacts", fields: [
    { name: "name", label: "Name" }, { name: "relationship", label: "Relationship" },
    { name: "phone", label: "Phone" }, { name: "email", label: "Email" },
    { name: "language", label: "Language" },
  ] },
  { title: "Allergies", endpoint: "allergies", key: "allergies", fields: [
    { name: "category", label: "Category", type: "select", options: options([
      ["food", "Food"], ["drug", "Drug"], ["environmental", "Environmental"],
    ]) },
    { name: "allergen", label: "Allergen" },
    { name: "severity", label: "Severity", type: "select", options: options([
      ["mild", "Mild"], ["moderate", "Moderate"], ["severe", "Severe"], ["unknown", "Unknown"],
    ]) },
    { name: "reaction", label: "Reaction", type: "textarea" },
    { name: "treatment", label: "Treatment", type: "textarea" },
  ] },
  { title: "Health", endpoint: "health-items", key: "health_items", fields: [
    { name: "category", label: "Type", type: "select", options: options([
      ["medication", "Medication"], ["chronic_condition", "Chronic condition"],
      ["mental_health_support", "Mental health support need"],
    ]) },
    { name: "name", label: "Name" }, { name: "details", label: "Details", type: "textarea" },
  ] },
  { title: "Pets", endpoint: "pets", key: "pets", fields: [
    { name: "name", label: "Name" }, { name: "species", label: "Species" },
    { name: "breed", label: "Breed" }, { name: "notes", label: "Notes", type: "textarea" },
  ] },
  { title: "Education", endpoint: "education", key: "education", fields: [
    { name: "university", label: "University or school" }, { name: "program", label: "Program" },
    { name: "study_level", label: "Study level", type: "select", options: options([
      ["school", "School"], ["undergraduate", "Undergraduate"], ["graduate", "Graduate"],
      ["doctoral", "Doctoral"], ["other", "Other"],
    ]) },
    { name: "notes", label: "Notes", type: "textarea" },
  ] },
  { title: "Interests, favorites and aspirations", endpoint: "interests", key: "interests", fields: [
    { name: "category", label: "Category", type: "select", options: options([
      ["hobby", "Hobby"], ["sport", "Sport"], ["music", "Music"], ["book", "Book"],
      ["movie", "Movie"], ["bucket_list", "Dream or aspiration"],
      ["favorite_food", "Favorite food"], ["technical_skill", "Technical skill"],
      ["media_preference", "Media preference"],
    ]) },
    { name: "name", label: "Item" }, { name: "details", label: "Details", type: "textarea" },
  ] },
];

const optionLabel = (field: Field, value: unknown) =>
  field.options?.find(option => option.value === String(value))?.label || String(value ?? "");

export default function PersonDetails({ personId, data }: { personId: number; data: Record<string, any> }) {
  const [items, setItems] = useState<Record<string, RecordItem[]>>(() =>
    Object.fromEntries(sections.map(section => [section.key, data[section.key] || []])));
  const [drafts, setDrafts] = useState<Record<string, Record<string, any>>>({});
  const [editing, setEditing] = useState<Record<string, number | null>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const begin = (section: Section, record?: RecordItem) => {
    setEditing(prev => ({ ...prev, [section.key]: record?.id ?? -1 }));
    setDrafts(prev => ({
      ...prev,
      [section.key]: Object.fromEntries(section.fields.map(field => [field.name, record?.[field.name] ?? ""])),
    }));
    setErrors(prev => ({ ...prev, [section.key]: "" }));
  };

  const save = async (event: React.FormEvent, section: Section) => {
    event.preventDefault();
    const current = drafts[section.key] || {};
    if (!section.fields.some(field => String(current[field.name] ?? "").trim())) {
      setErrors(prev => ({ ...prev, [section.key]: "Enter at least one value." }));
      return;
    }
    const editingId = editing[section.key];
    setBusy(section.key);
    setErrors(prev => ({ ...prev, [section.key]: "" }));
    try {
      const url = editingId && editingId > 0
        ? `/api/${section.endpoint}/${editingId}/`
        : `/api/${section.endpoint}/`;
      const payload: Record<string, any> = { ...current, person: personId };
      if (section.key === "life_events") payload.event_date = current.event_date || null;
      const response = await fetch(url, {
        method: editingId && editingId > 0 ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(JSON.stringify(result));
      setItems(prev => ({
        ...prev,
        [section.key]: editingId && editingId > 0
          ? prev[section.key].map(item => item.id === result.id ? result : item)
          : [result, ...prev[section.key]],
      }));
      setEditing(prev => ({ ...prev, [section.key]: null }));
      setDrafts(prev => ({ ...prev, [section.key]: {} }));
    } catch (error: any) {
      setErrors(prev => ({ ...prev, [section.key]: error.message || "Could not save this record." }));
    } finally {
      setBusy(null);
    }
  };

  const remove = async (section: Section, id: number) => {
    if (!window.confirm("Delete this record?")) return;
    setBusy(section.key);
    try {
      const response = await fetch(`/api/${section.endpoint}/${id}/`, { method: "DELETE" });
      if (!response.ok) throw new Error("Could not delete this record.");
      setItems(prev => ({ ...prev, [section.key]: prev[section.key].filter(item => item.id !== id) }));
    } catch (error: any) {
      setErrors(prev => ({ ...prev, [section.key]: error.message }));
    } finally {
      setBusy(null);
    }
  };

  return <div className="person-details">
    {sections.map(section => {
      const isEditing = editing[section.key] !== undefined && editing[section.key] !== null;
      return <details className="person-record-section" key={section.key} open={section.key === "notes" || section.key === "life_events"}>
        <summary>
          <span>{section.title}</span>
          <span className="text-muted">{items[section.key]?.length || 0}</span>
        </summary>
        <div className="person-record-content">
          {section.key === "life_events" && <p className="text-muted">Dates can be approximate. Add a place and source note when known.</p>}
          {section.key === "notes" && <p className="text-muted">Notes are saved with their creation date and shown newest first.</p>}
          <button type="button" className="btn btn-secondary" onClick={() => begin(section)}>
            Add {section.key === "notes" ? "note" : "record"}
          </button>
          {isEditing && <form className="person-record-form" onSubmit={event => save(event, section)}>
            {section.fields.map(field => {
              const value = drafts[section.key]?.[field.name] ?? "";
              const id = `${section.key}-${field.name}`;
              return <div className="form-group" key={field.name}>
                <label htmlFor={id}>{field.label}</label>
                {field.type === "select" ? <select id={id} className="input-field" required
                  value={value} onChange={event => setDrafts(prev => ({
                    ...prev, [section.key]: { ...prev[section.key], [field.name]: event.target.value },
                  }))}>
                  <option value="">Select...</option>
                  {field.options?.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select> : field.type === "textarea" ? <textarea id={id} className="input-field"
                  value={value} onChange={event => setDrafts(prev => ({
                    ...prev, [section.key]: { ...prev[section.key], [field.name]: event.target.value },
                  }))} /> : <input id={id} className="input-field" type={field.type || "text"}
                  value={value} onChange={event => setDrafts(prev => ({
                    ...prev, [section.key]: { ...prev[section.key], [field.name]: event.target.value },
                  }))} />}
              </div>;
            })}
            {errors[section.key] && <div className="error-banner">{errors[section.key]}</div>}
            <div className="flex-row">
              <button className="btn btn-primary" type="submit" disabled={busy === section.key}>{busy === section.key ? "Saving..." : "Save"}</button>
              <button className="btn btn-secondary" type="button" onClick={() => setEditing(prev => ({ ...prev, [section.key]: null }))}>Cancel</button>
            </div>
          </form>}
          {items[section.key]?.map(record => <article className="person-record" key={record.id}>
            <div className="person-record-heading">
              <strong>{record.title || record.name || record.language || record.allergen || record.university || record.model || record.content?.slice(0, 64)}</strong>
              <span className="text-muted">{record.created_at ? new Date(record.created_at).toLocaleString() : ""}</span>
            </div>
            <div className="person-record-fields">
              {section.fields.filter(field => field.name !== "title" && field.name !== "name" && field.name !== "content")
                .map(field => record[field.name] ? <p key={field.name}><b>{field.label}: </b>{field.type === "select" ? optionLabel(field, record[field.name]) : record[field.name]}</p> : null)}
              {record.content && <p className="person-note-content">{record.content}</p>}
              {record.event_date && <p><b>Date: </b>{record.event_date} ({optionLabel(section.fields.find(field => field.name === "date_precision")!, record.date_precision)})</p>}
            </div>
            <div className="flex-row">
              <button type="button" className="btn btn-secondary" onClick={() => begin(section, record)}>Edit</button>
              <button type="button" className="btn btn-secondary" disabled={busy === section.key} onClick={() => remove(section, record.id)}>Delete</button>
            </div>
          </article>)}
          {errors[section.key] && !isEditing && <div className="error-banner">{errors[section.key]}</div>}
          {!items[section.key]?.length && !isEditing && <p className="text-muted">No records yet.</p>}
        </div>
      </details>;
    })}
  </div>;
}
