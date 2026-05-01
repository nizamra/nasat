const relations = [
  { name: "Lisa", role: "Mother", id: "1" },
  { name: "Ethan", role: "Son", id: "2" },
  { name: "Sophie", role: "Fiancée", id: "3" },
  { name: "Mark", role: "Brother", id: "4" },
];

export default function Relations() {
  return (
    <div className="card">
      <h3>Relations</h3>
      <div className="flex-row space-between" style={{ marginTop: '16px' }}>
        {relations.map((r) => (
          <div key={r.id} className="flex-col items-center">
            <img className="avatar-sm" src={`https://i.pravatar.cc/100?img=${r.id}`} alt={r.name} />
            <p style={{ fontSize: '14px', fontWeight: 500 }}>{r.name}</p>
            <span className="text-muted" style={{ fontSize: '12px' }}>{r.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
