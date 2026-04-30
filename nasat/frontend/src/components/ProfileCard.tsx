export default function ProfileCard() {
  return (
    <div className="card row">
      <img
        className="avatar"
        src="https://i.pravatar.cc/150"
      />

      <div>
        <h2>Alex Morgan</h2>
        <p>@alex.morgan</p>
        <p>Entrepreneur · Investor · Traveler</p>

        <div className="row">
          <span>156 Posts</span>
          <span>8.2K Followers</span>
          <span>512 Following</span>
        </div>

        <button className="btn">Edit Profile</button>
      </div>
    </div>
  );
}
