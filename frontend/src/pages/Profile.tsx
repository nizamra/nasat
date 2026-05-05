import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import ProfileCard from "../components/ProfileCard";
import AboutCard from "../components/AboutCard";
import Relations from "../components/Relations";
import SocialLinks from "../components/SocialLinks";
import CreatePost from "../components/CreatePost";
import PostCard from "../components/PostCard";
import PhotosCard from "../components/PhotosCard";

// Updated helper function to return string | null instead of string | undefined
const getFullUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `http://staging.nasat.local${path.startsWith('/') ? '' : '/'}${path}`;
};

export default function Profile() {
  const { username } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`http://staging.nasat.local/api/users/${username}/`)
      .then(response => {
        setData(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching profile:", error);
        setLoading(false);
      });
  }, [username]);

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>User {username} not found.</div>;

  const avatarUrl = getFullUrl(data.avatar);

  return (
    <>
      <Header avatar={avatarUrl || undefined} />
      <div style={{ marginTop: '24px' }}>
        <ProfileCard 
          username={data.username}
          title={data.title}
          bio={data.bio}
          avatar={avatarUrl || null}
          is_verified={data.is_verified}
        />
      </div>

      <div className="grid-3" style={{ marginTop: '20px' }}>
        <AboutCard user={data} /> 
        <Relations />
        <SocialLinks links={data.social_links} />
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
          <CreatePost avatar={avatarUrl || undefined} />
          <PostCard 
            user={data.username} 
            handle={`@${data.username}`}
            time="Now"
            content="Finally connected to the backend!" 
            avatar={avatarUrl || undefined}
          />
        </div>
        <div>
          <PhotosCard />
        </div>
      </div>
    </>
  );
}
