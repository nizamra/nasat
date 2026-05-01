import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import ProfileCard from "../components/ProfileCard";
import AboutCard from "../components/AboutCard";
import Relations from "../components/Relations";
import SocialLinks from "../components/SocialLinks";
import CreatePost from "../components/CreatePost";
import PostCard from "../components/PostCard";
import PhotosCard from "../components/PhotosCard";

export default function Profile() {
  return (
    <div className="app-container">
      <Sidebar />

      <div className="main-content">
        <Header />

        <div style={{ marginTop: '24px' }}>
          <ProfileCard />
        </div>

        <div className="grid-3" style={{ marginTop: '20px' }}>
          <AboutCard />
          <Relations />
          <SocialLinks />
        </div>

        <div className="tabs">
          <div className="tab active">Posts</div>
          <div className="tab">About</div>
          <div className="tab">Photos</div>
          <div className="tab">Videos</div>
          <div className="tab">Friends</div>
          <div className="tab">Groups</div>
          <div className="tab">Likes</div>
        </div>

        <div className="grid-layout">
          <div className="flex-col" style={{ gap: '20px' }}>
            <CreatePost />
            <PostCard 
              user="Alex Morgan" 
              handle="@alex.morgan"
              time="2h"
              content="Focus on progress, not perfection." 
            />
          </div>

          <div>
            <PhotosCard />
          </div>
        </div>
      </div>
    </div>
  );
}
