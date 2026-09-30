import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type Birthday = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  avatar: string | null;
  birth_date: string;
  next_birthday: string; // YYYY-MM-DD
  turning_age: number;
  days_until: number;
};

const defaultAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%231a2235' width='100' height='100'/%3E%3Ccircle cx='50' cy='35' r='20' fill='%2394a3b8'/%3E%3Cpath d='M30 70 Q30 55 50 55 Q70 55 70 70 L70 100 L30 100 Z' fill='%2394a3b8'/%3E%3C/svg%3E";

// Parse YYYY-MM-DD as a local date (new Date("YYYY-MM-DD") would be UTC and can shift a day)
const parseDate = (value: string) => {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const fullName = (b: Birthday) =>
  `${b.first_name} ${b.last_name}`.trim() || b.username;

const whenLabel = (days: number) => {
  if (days === 0) return "Today 🎂";
  if (days === 1) return "Tomorrow";
  return `in ${days} days`;
};

export default function Events() {
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/users/birthdays/")
      .then(res => {
        if (!res.ok) throw new Error("Failed to load birthdays");
        return res.json();
      })
      .then(data => setBirthdays(data))
      .catch(err => setError(err.message || "Failed to load birthdays"))
      .finally(() => setLoading(false));
  }, []);

  // Group by month of the next occurrence; the API already sorts by date
  const groups: { label: string; items: Birthday[] }[] = [];
  for (const b of birthdays) {
    const label = parseDate(b.next_birthday).toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(b);
    else groups.push({ label, items: [b] });
  }

  return (
    <div>
      <h2>Events · Birthdays</h2>

      {loading && <p className="text-muted">Loading...</p>}
      {error && <div className="error-banner">✗ {error}</div>}
      {!loading && !error && birthdays.length === 0 && (
        <p className="text-muted">No birthdays yet. Add a birth date to a profile to see it here.</p>
      )}

      {groups.map(group => (
        <div key={group.label} className="card" style={{ marginTop: "20px" }}>
          <h3>{group.label}</h3>
          <div className="flex-col" style={{ marginTop: "16px", gap: "12px" }}>
            {group.items.map(b => (
              <div
                key={b.id}
                className="flex-row space-between"
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/profile/${b.username}`)}
              >
                <div className="flex-row" style={{ gap: "12px" }}>
                  <img className="avatar-sm" src={b.avatar || defaultAvatar} alt={fullName(b)} />
                  <div>
                    <div>{fullName(b)}</div>
                    <span className="text-muted">
                      {parseDate(b.next_birthday).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                      {" · turns "}{b.turning_age}
                    </span>
                  </div>
                </div>
                <span className={b.days_until === 0 ? "" : "text-muted"}>
                  {whenLabel(b.days_until)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
