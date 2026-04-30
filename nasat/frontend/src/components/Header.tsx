export default function Header() {
  return (
    <div className="card row" style={{ justifyContent: "space-between" }}>
      <input
        placeholder="Search..."
        style={{ flex: 1, marginRight: 10 }}
      />
      <button className="btn">+</button>
    </div>
  );
}
