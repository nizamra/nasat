const relations = [
  { name: "Lisa", role: "Mother" },
  { name: "Ethan", role: "Son" },
  { name: "Sophie", role: "Fiancée" },
];

export default function Relations() {
  return (
    <div className="card">
      <h3>Relations</h3>

      <div className="row">
        {relations.map((r, i) => (
          <div key={i}>
            <img
              className="small-avatar"
              src={`https://i.pravatar.cc/100?img=${i}`}
            />
            <p>{r.name}</p>
            <small>{r.role}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
