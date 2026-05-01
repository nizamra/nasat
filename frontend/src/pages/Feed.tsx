// src/pages/Feed.tsx
import { useEffect, useState } from "react";

type Post = {
  id: number;
  content: string;
  image: string;
  user: string;
};

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    fetch("/api/posts/")
      .then(res => res.json())
      .then(data => setPosts(data));
  }, []);

  return (
    <div className="feed">
      {posts.map(p => (
        <div key={p.id} className="card">
          <h4>{p.user}</h4>
          <p>{p.content}</p>
          {p.image && <img src={p.image} />}
        </div>
      ))}
    </div>
  );
}
