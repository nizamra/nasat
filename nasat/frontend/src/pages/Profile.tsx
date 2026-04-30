import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import ProfileCard from "../components/ProfileCard";
import Relations from "../components/Relations";
import SocialLinks from "../components/SocialLinks";
import PostCard from "../components/PostCard";

export default function Profile() {
  return (
    <div className="container">
      <Sidebar />

      <div className="main">
        <Header />

        <ProfileCard />

        <div className="row">
          <div style={{ flex: 2 }}>
            <PostCard user="Alex Morgan" content="Focus on progress." />
            <PostCard user="Alex Morgan" content="Another post..." />
          </div>

          <div style={{ flex: 1 }}>
            <Relations />
            <SocialLinks />
          </div>
        </div>
      </div>
    </div>
  );
}
