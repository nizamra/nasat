type Props = {
  user: string;
  content: string;
};

export default function PostCard({ user, content }: Props) {
  return (
    <div className="card">
      <h4>{user}</h4>
      <p>{content}</p>
    </div>
  );
}
